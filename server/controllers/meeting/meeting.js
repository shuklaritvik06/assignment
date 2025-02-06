const MeetingHistory = require('../../model/schema/meeting')
const mongoose = require('mongoose');
const User = require('../../model/schema/user')

async function getNextAutoIncrementValue() {
    const num = await MeetingHistory.countDocuments({});
    return num + 1;
}

const index = async (req, res) => {
    query = req.query;
    query.deleted = false;
    const user = await User.findById(req.user.userId)
    if (user?.role !== "superAdmin") {
        delete query.createBy
        query.$or = [{ createBy: new mongoose.Types.ObjectId(req.user.userId) }, { assignUser: new mongoose.Types.ObjectId(req.user.userId) }];
    }
    try {
        let result = await MeetingHistory.aggregate([
            { $match: query },
            {
                $lookup: {
                    from: "Contact",
                    localField: "attendes",
                    foreignField: "_id",
                    as: "attendesData",
                },
            },
            {
                $lookup: {
                    from: "Lead",
                    localField: "attendesLead",
                    foreignField: "_id",
                    as: "attendesLeadData",
                },
            },
            {
                $lookup: {
                    from: "User",
                    localField: "createBy",
                    foreignField: "_id",
                    as: "users",
                },
            },
            { $unwind: { path: "$users", preserveNullAndEmptyArrays: true } },
            { $match: { "users.deleted": false } },
            {
                $addFields: {
                    createdByName: { $concat: ['$users.firstName', ' ', '$users.lastName'] },
                    attendeesNames: {
                        $map: {
                            input: "$attendesData",
                            as: "attendee",
                            in: { $concat: ["$$attendee.firstName", " ", "$$attendee.lastName"] }
                        }
                    },
                    attendesLeadNames: {
                        $map: {
                            input: "$attendesLeadData",
                            as: "lead",
                            in: { $concat: ["$$lead.firstName", " ", "$$lead.lastName"] }
                        }
                    }
                }
            },
            { $project: { users: 0, attendesData: 0, attendesLeadData: 0 } },
        ]);
        res.send(result);
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    }
};

const add = async (req, res) => {
    try {
        const nextAutoIncrementValue = await getNextAutoIncrementValue();
        const result = new MeetingHistory({
            ...req.body,
            meetingNumber: nextAutoIncrementValue,
            createBy: req.user.userId
        });
        await result.save();
        res.status(200).json(result);
    } catch (err) {
        console.error("Failed to create Meeting:", err);
        res.status(400).json({ error: "Failed to create Meeting : ", err });
    }
};

const view = async (req, res) => {
    try {
        let response = await MeetingHistory.findOne({ _id: req.params.id });
        if (!response) return res.status(404).json({ message: "no Data Found." });

        let result = await MeetingHistory.aggregate([
            { $match: { _id: response._id } },
            {
                $lookup: {
                    from: "Contact",
                    localField: "attendes",
                    foreignField: "_id",
                    as: "attendesData",
                },
            },
            {
                $lookup: {
                    from: "Lead",
                    localField: "attendesLead",
                    foreignField: "_id",
                    as: "attendesLeadData",
                },
            },
            {
                $lookup: {
                    from: "User",
                    localField: "createBy",
                    foreignField: "_id",
                    as: "users",
                },
            },
            { $unwind: { path: "$users", preserveNullAndEmptyArrays: true } },
            { $match: { "users.deleted": false } },
            {
                $addFields: {
                    createdByName: { $concat: ['$users.firstName', ' ', '$users.lastName'] },
                    attendeesNames: {
                        $map: {
                            input: "$attendesData",
                            as: "attendee",
                            in: { $concat: ["$$attendee.firstName", " ", "$$attendee.lastName"] }
                        }
                    },
                    attendesLeadNames: {
                        $map: {
                            input: "$attendesLeadData",
                            as: "lead",
                            in: { $concat: ["$$lead.firstName", " ", "$$lead.lastName"] }
                        }
                    }
                }
            },
            { $project: { users: 0, attendesData: 0, attendesLeadData: 0 } },
        ]);

        res.status(200).json(result[0]);
    } catch (err) {
        console.log("Error:", err);
        res.status(400).json({ Error: err });
    }
};

const deleteData = async (req, res) => {
    try {
        const result = await MeetingHistory.findByIdAndUpdate(req.params.id, {
            deleted: true,
        });
        res.status(200).json({ message: "done", result });
    } catch (err) {
        res.status(404).json({ message: "error", err });
    }
};

const deleteMany = async (req, res) => {
    try {
        const result = await MeetingHistory.updateMany(
            { _id: { $in: req.body } },
            { $set: { deleted: true } }
        );

        if (result?.matchedCount > 0 && result?.modifiedCount > 0) {
            return res
                .status(200)
                .json({ message: "Meetings Removed successfully", result });
        } else {
            return res
                .status(404)
                .json({ success: false, message: "Failed to remove Meetings" });
        }
    } catch (err) {
        return res.status(404).json({ success: false, message: "error", err });
    }
};

module.exports = { index, add, view, deleteData, deleteMany };
