
const Client = require("../models/Client");
const ClientAccount = require("../models/Client").ClientAccount;

const Availability = require("../models/Availability");
const Session = require("../models/Session");
const Therapist = require("../models/Therapist");
const ClientPackage = require("../models/ClientPackage");

const mongoose = require("mongoose");

const {
  bookingConfirmation,
  postSessionFollowUp
} = require("../services/notificationService");

const ALLOWED_DURATIONS = [30, 45, 60, 90];

function isValidTime(value) {
  return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function toMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function fromMinutes(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

function parseDate(date) {
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return null;
  }

  const parsed = new Date(`${date}T00:00:00.000Z`);

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== date
  ) {
    return null;
  }

  return parsed;
}

function getDayRange(date) {
  const start = new Date(date);
  const end = new Date(date);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

function validateWindow(startTime, endTime) {
  return (
    isValidTime(startTime) &&
    isValidTime(endTime) &&
    toMinutes(startTime) < toMinutes(endTime)
  );
}

function isOverlapping(startA, endA, startB, endB) {
  return startA < endB && endA > startB;
}

// Create weekly availability
exports.setAvailability = async (req, res) => {
  try {
    const {
      dayOfWeek,
      startTime,
      endTime,
      slotDuration,
      bufferMinutes = 0
    } = req.body;

    if (
      !Number.isInteger(dayOfWeek) ||
      dayOfWeek < 0 ||
      dayOfWeek > 6 ||
      !validateWindow(startTime, endTime) ||
      !ALLOWED_DURATIONS.includes(slotDuration || 60) ||
      !Number.isInteger(bufferMinutes) ||
      bufferMinutes < 0 ||
      bufferMinutes > 60
    ) {
      return res.status(400).json({
        message: "Invalid availability details"
      });
    }

    const availability = await Availability.create({
      therapist: req.therapist._id,
      type: "weekly",
      dayOfWeek,
      startTime,
      endTime,
      slotDuration: slotDuration || 60,
      bufferMinutes
    });

    res.status(201).json({
      message: "Weekly availability saved",
      availability
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a one-time availability override
exports.setOverride = async (req, res) => {
  try {
    const {
      date,
      startTime,
      endTime,
      slotDuration,
      bufferMinutes = 0
    } = req.body;

    const parsedDate = parseDate(date);

    if (
      !parsedDate ||
      !validateWindow(startTime, endTime) ||
      !ALLOWED_DURATIONS.includes(slotDuration || 60) ||
      !Number.isInteger(bufferMinutes) ||
      bufferMinutes < 0 ||
      bufferMinutes > 60
    ) {
      return res.status(400).json({
        message: "Invalid override details"
      });
    }

    const availability = await Availability.create({
      therapist: req.therapist._id,
      type: "override",
      date: parsedDate,
      startTime,
      endTime,
      slotDuration: slotDuration || 60,
      bufferMinutes
    });

    res.status(201).json({
      message: "Date override saved",
      availability
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Block a full date or a specific time range
exports.blockAvailability = async (req, res) => {
  try {
    const { date, startTime, endTime } = req.body;
    const parsedDate = parseDate(date);

    if (!parsedDate) {
      return res.status(400).json({
        message: "A valid date is required"
      });
    }

    if ((startTime || endTime) && !validateWindow(startTime, endTime)) {
      return res.status(400).json({
        message: "Provide a valid start and end time"
      });
    }

    const availability = await Availability.create({
      therapist: req.therapist._id,
      type: "blocked",
      date: parsedDate,
      startTime: startTime || undefined,
      endTime: endTime || undefined
    });

    res.status(201).json({
      message: "Date or time blocked",
      availability
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get therapist's availability
exports.getAvailability = async (req, res) => {
  try {
    const availability = await Availability.find({
      therapist: req.therapist._id,
      isActive: true
    }).sort({ dayOfWeek: 1, date: 1, startTime: 1 });

    res.json({ availability });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Public availability lookup using therapist slug and date
exports.getPublicAvailability = async (req, res) => {
  try {
    const therapist = await Therapist.findOne({
      slug: req.params.slug
    }).select("_id");

    if (!therapist) {
      return res.status(404).json({
        message: "Therapist not found"
      });
    }

    const date = parseDate(req.query.date);

    if (
      !date ||
      date <= new Date(
        new Date().toISOString().slice(0, 10) + "T00:00:00.000Z"
      )
    ) {
      return res.status(400).json({
        message: "Choose a valid future date"
      });
    }

    const dayOfWeek = date.getUTCDay();
    const { start, end } = getDayRange(date);

    const [overrides, weekly, blocks, sessions] = await Promise.all([
      Availability.find({
        therapist: therapist._id,
        type: "override",
        date,
        isActive: true
      }),
      Availability.find({
        therapist: therapist._id,
        type: "weekly",
        dayOfWeek,
        isActive: true
      }),
      Availability.find({
        therapist: therapist._id,
        type: "blocked",
        date,
        isActive: true
      }),
      Session.find({
        therapist: therapist._id,
        date: { $gte: start, $lt: end },
        status: { $in: ["pending", "confirmed"] }
      }).select("startTime endTime bufferMinutes")
    ]);

    const windows = overrides.length ? overrides : weekly;
    const slots = [];

    for (const window of windows) {
      const duration = window.slotDuration || 60;
      const buffer = window.bufferMinutes || 0;

      for (
        let startMinutes = toMinutes(window.startTime);
        startMinutes + duration <= toMinutes(window.endTime);
        startMinutes += duration + buffer
      ) {
        const slotStart = startMinutes;
        const slotEnd = startMinutes + duration;

        const blocked = blocks.some((block) => {
          if (!block.startTime || !block.endTime) return true;

          return isOverlapping(
            slotStart,
            slotEnd,
            toMinutes(block.startTime),
            toMinutes(block.endTime)
          );
        });

        const booked = sessions.some((session) => {
          const existingStart = toMinutes(session.startTime);
          const existingEnd =
            toMinutes(session.endTime) + (session.bufferMinutes || 0);

          return isOverlapping(
            slotStart,
            slotEnd + buffer,
            existingStart,
            existingEnd
          );
        });

        if (!blocked && !booked) {
          slots.push({
            startTime: fromMinutes(slotStart),
            endTime: fromMinutes(slotEnd),
            duration,
            bufferMinutes: buffer
          });
        }
      }
    }

    res.json({
      date: req.query.date,
      slots
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

async function createBooking(
  therapistId,
  body,
  res,
  clientAccount = null,
  requireIntake = false
) {
  const {
    clientName,
    clientEmail,
    date,
    startTime,
    duration,
    sessionType,
    age,
    gender,
    occupation,
    presentingConcern,
    relevantHistory,
    therapyGoals,
    consentGiven
  } = body;

  const parsedDate = parseDate(date);
  const selectedDuration = Number(duration);

  if (
    !clientName ||
    !clientEmail ||
    !parsedDate ||
    !isValidTime(startTime) ||
    !ALLOWED_DURATIONS.includes(selectedDuration) ||
    !["online", "in-person"].includes(sessionType || "online")
  ) {
    return res.status(400).json({
      message: "Invalid booking details"
    });
  }

  if (requireIntake) {
    if (consentGiven !== true) {
      return res.status(400).json({
        message: "Consent is required before booking."
      });
    }

    if (!presentingConcern?.trim()) {
      return res.status(400).json({
        message: "Please provide your presenting concern."
      });
    }

    if (
      age !== undefined &&
      age !== "" &&
      (!Number.isInteger(Number(age)) ||
        Number(age) < 1 ||
        Number(age) > 120)
    ) {
      return res.status(400).json({
        message: "Please provide a valid age."
      });
    }
  }

  if (
    parsedDate <
    new Date(new Date().toISOString().slice(0, 10) + "T00:00:00.000Z")
  ) {
    return res.status(400).json({
      message: "Choose a future appointment date"
    });
  }

  const startMinutes = toMinutes(startTime);
  const endMinutes = startMinutes + selectedDuration;

  if (endMinutes > 1440) {
    return res.status(400).json({
      message: "Appointment cannot extend past midnight"
    });
  }

  const endTime = fromMinutes(endMinutes);
  const now = new Date();
  const lockUntil = new Date(now.getTime() + 30000);

  // Atomic per-therapist booking lock
  const lockResult = await Therapist.collection.updateOne(
    {
      _id: therapistId,
      $or: [
        { bookingLockUntil: { $exists: false } },
        { bookingLockUntil: null },
        { bookingLockUntil: { $lt: now } }
      ]
    },
    {
      $set: { bookingLockUntil: lockUntil }
    }
  );

  if (lockResult.modifiedCount !== 1) {
    return res.status(409).json({
      message: "Another booking is being processed. Please try again shortly."
    });
  }

  try {
    const dayOfWeek = parsedDate.getUTCDay();
    const { start, end } = getDayRange(parsedDate);

    const [overrides, weekly, blocks] = await Promise.all([
      Availability.find({
        therapist: therapistId,
        type: "override",
        date: parsedDate,
        isActive: true
      }),
      Availability.find({
        therapist: therapistId,
        type: "weekly",
        dayOfWeek,
        isActive: true
      }),
      Availability.find({
        therapist: therapistId,
        type: "blocked",
        date: parsedDate,
        isActive: true
      })
    ]);

    const windows = overrides.length ? overrides : weekly;

    const matchingWindow = windows.find((window) => {
      const windowStart = toMinutes(window.startTime);
      const windowEnd = toMinutes(window.endTime);

      return (
        startMinutes >= windowStart &&
        endMinutes <= windowEnd
      );
    });

    if (!matchingWindow) {
      return res.status(400).json({
        message: "Therapist is not available at this time"
      });
    }

    const buffer = matchingWindow.bufferMinutes || 0;
    const configuredDuration = matchingWindow.slotDuration || 60;
    const slotStep = configuredDuration + buffer;
    const offset = startMinutes - toMinutes(matchingWindow.startTime);

    if (
      selectedDuration !== configuredDuration ||
      offset < 0 ||
      offset % slotStep !== 0
    ) {
      return res.status(400).json({
        message: "Please select a valid available time slot"
      });
    }

    const blocked = blocks.some((block) => {
      if (!block.startTime || !block.endTime) return true;

      return isOverlapping(
        startMinutes,
        endMinutes,
        toMinutes(block.startTime),
        toMinutes(block.endTime)
      );
    });

    if (blocked) {
      return res.status(400).json({
        message: "This time is blocked by the therapist"
      });
    }

    const sessions = await Session.find({
      therapist: therapistId,
      date: { $gte: start, $lt: end },
      status: { $in: ["pending", "confirmed"] }
    }).select("startTime endTime bufferMinutes");

    const conflict = sessions.some((session) => {
      const existingStart = toMinutes(session.startTime);
      const existingEnd =
        toMinutes(session.endTime) + (session.bufferMinutes || 0);

      return isOverlapping(
        startMinutes,
        endMinutes + buffer,
        existingStart,
        existingEnd
      );
    });

    if (conflict) {
      return res.status(409).json({
        message: "This appointment slot is already booked"
      });
    }

    const normalizedEmail = clientAccount
      ? clientAccount.email
      : clientEmail.trim().toLowerCase();

    const normalizedName = clientAccount
      ? clientAccount.name
      : clientName.trim();

    const clientUpdates = {};

    if (clientAccount) {
      clientUpdates.account = clientAccount._id;
    }

    if (requireIntake) {
      clientUpdates.gender = gender || "";
      clientUpdates.occupation = occupation?.trim() || "";
      clientUpdates.presentingConcern = presentingConcern.trim();
      clientUpdates.relevantHistory = relevantHistory?.trim() || "";
      clientUpdates.therapyGoals = therapyGoals?.trim() || "";
      clientUpdates.consentGiven = true;
      clientUpdates.consentAt = new Date();
      clientUpdates.intakeSubmittedAt = new Date();

      if (age !== undefined && age !== "") {
        clientUpdates.age = Number(age);
      }
    }

    const client = await Client.findOneAndUpdate(
      {
        therapist: therapistId,
        email: normalizedEmail
      },
      {
        $setOnInsert: {
          therapist: therapistId,
          name: normalizedName,
          email: normalizedEmail
        },
        $set: clientUpdates
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
        runValidators: true
      }
    );

    const session = await Session.create({
      therapist: therapistId,
      client: client._id,
      clientName: clientName.trim(),
      clientEmail: normalizedEmail,
      date: parsedDate,
      startTime,
      endTime,
      bufferMinutes: buffer,
      sessionType: sessionType || "online",
      status: "confirmed"
    });

    // Send in-app booking notifications to both sides
    try {
      const notificationClient =
        clientAccount ||
        await ClientAccount.findOne({
          email: normalizedEmail
        }).select("_id name");

      const therapistDetails = await Therapist.findById(
        therapistId
      ).select("name");

      await bookingConfirmation({
        therapistId,
        clientAccountId: notificationClient?._id,
        clientName: client.name,
        therapistName: therapistDetails?.name || "your therapist"
      });
    } catch (notificationError) {
      console.error(
        "Booking notification failed:",
        notificationError.message
      );
    }

    return res.status(201).json({
      message: "Appointment booked successfully",
      session
    });
  } finally {
    await Therapist.collection.updateOne(
      { _id: therapistId },
      { $set: { bookingLockUntil: new Date(0) } }
    );
  }
}

// Public booking through branded therapist link
exports.bookPublicSession = async (req, res) => {
  try {
    const therapist = await Therapist.findOne({
      slug: req.params.slug
    }).select("_id");

    if (!therapist) {
      return res.status(404).json({
        message: "Therapist not found"
      });
    }

    await createBooking(
      therapist._id,
      req.body,
      res,
      null,
      true
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Booking by a logged-in client
exports.bookClientSession = async (req, res) => {
  try {
    const { slug } = req.params;

    const therapist = await Therapist.findOne({
      slug
    }).select("_id");

    if (!therapist) {
      return res.status(404).json({
        message: "Therapist not found"
      });
    }

    const clientAccount = req.clientAccount;

    if (!clientAccount) {
      return res.status(401).json({
        message: "Client authentication required"
      });
    }

    const bookingBody = {
      ...req.body,
      clientName: clientAccount.name,
      clientEmail: clientAccount.email
    };

    await createBooking(
      therapist._id,
      bookingBody,
      res,
      clientAccount,
      true
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Therapist-created booking
exports.bookSession = async (req, res) => {
  try {
    await createBooking(
      req.therapist._id,
      req.body,
      res
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get therapist appointments
exports.getSessions = async (req, res) => {
  try {
    const sessions = await Session.find({
      therapist: req.therapist._id
    }).sort({ date: 1, startTime: 1 });

    res.json({ sessions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update appointment status
exports.updateSession = async (req, res) => {
  const mongoSession = await mongoose.startSession();

  try {
    const { status } = req.body;

    const validStatuses = [
      "pending",
      "confirmed",
      "completed",
      "cancelled",
      "no-show"
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid appointment status"
      });
    }

    let resultSession = null;

    let packageDeduction = {
      deducted: false,
      reason: null,
      remainingSessions: null
    };

    let shouldSendFollowUp = false;

    await mongoSession.withTransaction(async () => {
      const existingSession = await Session.findOne({
        _id: req.params.id,
        therapist: req.therapist._id
      }).session(mongoSession);

      if (!existingSession) {
        const error = new Error("Appointment not found");
        error.statusCode = 404;
        throw error;
      }

      if (existingSession.status === "completed") {
        if (status !== "completed") {
          const error = new Error(
            "A completed appointment cannot be changed."
          );
          error.statusCode = 409;
          throw error;
        }

        resultSession = existingSession;
        packageDeduction.reason = "Appointment was already completed";
        return;
      }

      if (status === "completed") {
        shouldSendFollowUp = true;

        if (existingSession.client) {
          const now = new Date();

          const clientPackage = await ClientPackage.findOne({
            therapist: req.therapist._id,
            client: existingSession.client,
            status: "active",
            expiryDate: { $gt: now },
            $expr: {
              $lt: ["$usedSessions", "$totalSessions"]
            }
          })
            .sort({ expiryDate: 1, purchaseDate: 1 })
            .session(mongoSession);

          if (clientPackage) {
            const updatedPackage = await ClientPackage.findOneAndUpdate(
              {
                _id: clientPackage._id,
                therapist: req.therapist._id,
                client: existingSession.client,
                status: "active",
                expiryDate: { $gt: now },
                usedSessions: clientPackage.usedSessions,
                totalSessions: clientPackage.totalSessions
              },
              {
                $inc: { usedSessions: 1 }
              },
              {
                new: true,
                session: mongoSession
              }
            );

            if (!updatedPackage) {
              const error = new Error(
                "Package balance changed. Please try completing the appointment again."
              );
              error.statusCode = 409;
              throw error;
            }

            if (
              updatedPackage.usedSessions >=
              updatedPackage.totalSessions
            ) {
              updatedPackage.status = "completed";

              await updatedPackage.save({
                session: mongoSession
              });
            }

            existingSession.deductedClientPackage = updatedPackage._id;
            existingSession.packageDeductedAt = new Date();

            packageDeduction = {
              deducted: true,
              remainingSessions:
                updatedPackage.totalSessions -
                updatedPackage.usedSessions
            };
          } else {
            packageDeduction.reason =
              "No active package with remaining sessions was found";
          }
        } else {
          packageDeduction.reason =
            "This appointment is not linked to a client record";
        }
      }

      existingSession.status = status;

      await existingSession.save({
        session: mongoSession
      });

      resultSession = existingSession;
    });

    // Send in-app notifications after the transaction succeeds
    if (shouldSendFollowUp && resultSession) {
      try {
        const clientRecord = resultSession.client
          ? await Client.findById(
              resultSession.client
            ).select("account name email")
          : null;

        const notificationClient = clientRecord?.account
          ? await ClientAccount.findById(
              clientRecord.account
            ).select("_id name")
          : await ClientAccount.findOne({
              email: (
                clientRecord?.email ||
                resultSession.clientEmail ||
                ""
              ).trim().toLowerCase()
            }).select("_id name");

        const therapistDetails = await Therapist.findById(
          req.therapist._id
        ).select("name");

        await postSessionFollowUp({
          therapistId: req.therapist._id,
          clientAccountId: notificationClient?._id,
          clientName:
            clientRecord?.name ||
            resultSession.clientName ||
            "Your client",
          therapistName:
            therapistDetails?.name || "your therapist"
        });
      } catch (notificationError) {
        console.error(
          "Post-session notification failed:",
          notificationError.message
        );
      }
    }

    return res.json({
      message: "Appointment updated successfully",
      session: resultSession,
      packageDeduction
    });
  } catch (error) {
    console.error("Update session error:", error);

    return res.status(error.statusCode || 500).json({
      message: error.message || "Failed to update appointment"
    });
  } finally {
    await mongoSession.endSession();
  }
};

// Delete therapist availability (soft delete)
exports.deleteAvailability = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid availability ID"
      });
    }

    const availability = await Availability.findOne({
      _id: id,
      therapist: req.therapist._id,
      isActive: true
    });

    if (!availability) {
      return res.status(404).json({
        message: "Schedule not found or already deleted"
      });
    }

    if (
      availability.type === "weekly" ||
      availability.type === "override"
    ) {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      const upcomingSessions = await Session.find({
        therapist: req.therapist._id,
        date: { $gte: today },
        status: { $in: ["pending", "confirmed"] }
      }).select("date startTime endTime bufferMinutes");

      const hasUpcomingBooking = upcomingSessions.some((session) => {
        const sessionDate = new Date(session.date);

        if (availability.type === "weekly") {
          if (sessionDate.getUTCDay() !== availability.dayOfWeek) {
            return false;
          }
        } else {
          if (
            sessionDate.toISOString().slice(0, 10) !==
            availability.date.toISOString().slice(0, 10)
          ) {
            return false;
          }
        }

        const appointmentStart = toMinutes(session.startTime);
        const appointmentEnd =
          toMinutes(session.endTime) +
          (session.bufferMinutes || 0);

        return isOverlapping(
          appointmentStart,
          appointmentEnd,
          toMinutes(availability.startTime),
          toMinutes(availability.endTime)
        );
      });

      if (hasUpcomingBooking) {
        return res.status(409).json({
          message:
            "This schedule has upcoming appointments. Please reschedule or cancel those appointments before deleting it."
        });
      }
    }

    availability.isActive = false;
    await availability.save();

    return res.status(200).json({
      message: "Schedule deleted successfully",
      availabilityId: availability._id
    });
  } catch (error) {
    console.error("Delete availability error:", error);

    return res.status(500).json({
      message: "Unable to delete schedule"
    });
  }
};
