
const Payment = require("../models/Payment");
const Client = require("../models/Client");
const Session = require("../models/Session");
const Package = require("../models/Package");
const { canAccess } = require("../services/entitlementService");

const getAnalytics = async (req, res) => {
  try {
    const therapistId = req.therapist._id;


    const [
      isAdvanced,
      hasClientRetention,
      hasPackageAnalytics,
      hasPaymentAnalytics,
      hasAppointmentInsights
    ] = await Promise.all([
      canAccess(therapistId, "advancedAnalytics"),
      canAccess(therapistId, "clientRetentionAnalytics"),
      canAccess(therapistId, "packageAnalytics"),
      canAccess(therapistId, "paymentAnalytics"),
      canAccess(therapistId, "appointmentInsights")
    ]);

   

    const now = new Date();

    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );

    const startOfNextMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      1
    );

    const sixMonthsAgo = new Date(
      now.getFullYear(),
      now.getMonth() - 5,
      1
    );

 
    const [
      activeClients,
      totalSessions,
      newClientsThisMonth,
      sessionsThisMonth
    ] = await Promise.all([
      Client.countDocuments({
        therapist: therapistId,
        status: "active"
      }),

      Session.countDocuments({
        therapist: therapistId
      }),

      Client.countDocuments({
        therapist: therapistId,
        createdAt: {
          $gte: startOfMonth,
          $lt: startOfNextMonth
        }
      }),

      Session.countDocuments({
        therapist: therapistId,
        date: {
          $gte: startOfMonth,
          $lt: startOfNextMonth
        }
      })
    ]);

    const analytics = {
      activeClients,
      totalSessions,
      newClientsThisMonth,
      sessionsThisMonth,

      featureAccess: {
        advancedAnalytics: isAdvanced,
        clientRetentionAnalytics: hasClientRetention,
        packageAnalytics: hasPackageAnalytics,
        paymentAnalytics: hasPaymentAnalytics,
        appointmentInsights: hasAppointmentInsights
      }
    };

   

    if (isAdvanced) {
      const [
        completedSessions,
        cancelledSessions,
        noShowSessions,
        revenueTrend,
        totalRevenue
      ] = await Promise.all([

        Session.countDocuments({
          therapist: therapistId,
          status: "completed"
        }),

        Session.countDocuments({
          therapist: therapistId,
          status: "cancelled"
        }),

        Session.countDocuments({
          therapist: therapistId,
          status: "no-show"
        }),

        Payment.aggregate([
          {
            $match: {
              therapist: therapistId,
              status: "success",
              paymentType: { $ne: "subscription" },
              createdAt: { $gte: sixMonthsAgo }
            }
          },
          {
            $group: {
              _id: {
                year: { $year: "$createdAt" },
                month: { $month: "$createdAt" }
              },
              revenue: { $sum: "$amount" }
            }
          },
          {
            $sort: {
              "_id.year": 1,
              "_id.month": 1
            }
          }
        ]),

       
        Payment.aggregate([
          {
            $match: {
              therapist: therapistId,
              status: "success",
              paymentType: { $ne: "subscription" }
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: "$amount" }
            }
          }
        ])
      ]);

    
      const attendanceSessions =
        completedSessions + noShowSessions;

      const noShowRate = attendanceSessions === 0
        ? 0
        : Number(
            (
              (noShowSessions / attendanceSessions) * 100
            ).toFixed(2)
          );

      analytics.completedSessions = completedSessions;
      analytics.cancelledSessions = cancelledSessions;
      analytics.noShowSessions = noShowSessions;
      analytics.noShowRate = noShowRate;
      analytics.revenueTrend = revenueTrend;
      analytics.totalRevenue = totalRevenue[0]?.total || 0;
    }

   
    if (hasClientRetention) {
      const clientRetention = await Session.aggregate([
        {
          $match: {
            therapist: therapistId,
            status: "completed",
            client: { $ne: null }
          }
        },
        {
          $group: {
            _id: "$client",
            completedSessions: { $sum: 1 }
          }
        },
        {
          $group: {
            _id: null,

            clientsWithCompletedSessions: {
              $sum: 1
            },

            repeatClients: {
              $sum: {
                $cond: [
                  { $gte: ["$completedSessions", 2] },
                  1,
                  0
                ]
              }
            }
          }
        }
      ]);

      const retentionData = clientRetention[0] || {
        clientsWithCompletedSessions: 0,
        repeatClients: 0
      };

      const retentionRate =
        retentionData.clientsWithCompletedSessions === 0
          ? 0
          : Number(
              (
                (retentionData.repeatClients /
                  retentionData.clientsWithCompletedSessions) *
                100
              ).toFixed(2)
            );

      analytics.clientRetention = {
        clientsWithCompletedSessions:
          retentionData.clientsWithCompletedSessions,

        repeatClients: retentionData.repeatClients,

        retentionRate
      };
    }

    

    if (hasPackageAnalytics) {
      const packagePerformance = await Payment.aggregate([
        {
          $match: {
            therapist: therapistId,
            status: "success",
            paymentType: "package",
            package: { $ne: null }
          }
        },
        {
          $lookup: {
            from: Package.collection.name,
            localField: "package",
            foreignField: "_id",
            as: "packageDetails"
          }
        },
        {
          $unwind: {
            path: "$packageDetails",
            preserveNullAndEmptyArrays: false
          }
        },
        {
          $group: {
            _id: "$package",
            packageName: {
              $first: "$packageDetails.name"
            },
            sales: { $sum: 1 },
            revenue: { $sum: "$amount" }
          }
        },
        {
          $sort: {
            revenue: -1
          }
        },
        {
          $project: {
            _id: 1,
            packageName: 1,
            sales: 1,
            revenue: 1
          }
        }
      ]);

      analytics.packagePerformance = packagePerformance;

      analytics.totalPackageSales = packagePerformance.reduce(
        (total, item) => total + item.sales,
        0
      );
    }

   
    if (hasPaymentAnalytics) {
      const outstandingPayments = await Payment.aggregate([
        {
          $match: {
            therapist: therapistId,
            status: "pending",
            paymentType: { $ne: "subscription" }
          }
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            amount: { $sum: "$amount" }
          }
        }
      ]);

      analytics.outstandingPayments = {
        count: outstandingPayments[0]?.count || 0,
        amount: outstandingPayments[0]?.amount || 0
      };
    }

  

    if (hasAppointmentInsights) {
      const popularAppointmentDays = await Session.aggregate([
        {
          $match: {
            therapist: therapistId,
            status: { $ne: "cancelled" }
          }
        },
        {
          $group: {
            _id: {
              $dayOfWeek: "$date"
            },
            totalSessions: { $sum: 1 }
          }
        },
        {
          $sort: {
            totalSessions: -1
          }
        },
        {
          $project: {
            _id: 0,

            dayNumber: "$_id",

            totalSessions: 1
          }
        }
      ]);

      const dayNames = {
        1: "Sunday",
        2: "Monday",
        3: "Tuesday",
        4: "Wednesday",
        5: "Thursday",
        6: "Friday",
        7: "Saturday"
      };

      analytics.popularAppointmentDays =
        popularAppointmentDays.map((item) => ({
          day: dayNames[item.dayNumber],
          totalSessions: item.totalSessions
        }));
    }

    return res.status(200).json(analytics);

  } catch (error) {
    console.error("Analytics Error:", error);

    return res.status(500).json({
      message: "Unable to fetch analytics"
    });
  }
};

module.exports = { getAnalytics };
