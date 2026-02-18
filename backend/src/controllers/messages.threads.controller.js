"use strict";

const mongoose = require("mongoose");
const Community = require("../models/community.model");
const CommunityMember = require("../models/communityMember.model");
const Course = require("../models/course.model");
const CourseEnrollment = require("../models/courseEnrollment.model");
const Group = require("../models/group.model");
const User = require("../models/user.model");

function toId(x) {
  return typeof x === "string" ? new mongoose.Types.ObjectId(x) : x;
}

/** GET /api/messages/threads */
module.exports.listDerived = async (req, res) => {
  try {
    const meId = toId(req.user.id);

    // ---- 1) DMs où JE SUIS MEMBRE (owner = admin) ----
    const myMemberships = await CommunityMember.find({ userId: meId })
      .select({ communityId: 1 })
      .lean();

    const communityIdsIMember = myMemberships.map((m) => m.communityId);

    const communitiesIMember = communityIdsIMember.length
      ? await Community.find({
          _id: { $in: communityIdsIMember },
          deletedAt: null,
        })
          .select({ _id: 1, name: 1, logoUrl: 1, ownerId: 1 })
          .lean()
      : [];

    const ownerIds = [
      ...new Set(communitiesIMember.map((c) => String(c.ownerId))),
    ].map(toId);
    const ownersById = {};
    if (ownerIds.length) {
      const owners = await User.find({ _id: { $in: ownerIds } })
        .select({ _id: 1, name: 1, avatarUrl: 1 })
        .lean();
      owners.forEach((u) => {
        ownersById[String(u._id)] = u;
      });
    }

    const dmAsMember = communitiesIMember
      .filter((c) => String(c.ownerId) !== String(meId)) // pas de DM moi↔moi
      .map((c) => {
        const owner = ownersById[String(c.ownerId)] || {};
        return {
          id: `priv:${c._id}:${c.ownerId}:${meId}`,
          type: "private",
          lastMessageAt: null,
          unreadCount: 0,
          lastMessage: null,
          private: {
            community: { name: c.name, logoUrl: c.logoUrl },
            owner: {
              id: String(c.ownerId),
              name: owner.name || "Admin",
              avatar: owner.avatarUrl || "",
            },
            member: { id: String(meId) },
          },
        };
      });

    // ---- 2) DMs où JE SUIS OWNER (vers mes membres) ----
    const myCommunities = await Community.find({
      ownerId: meId,
      deletedAt: null,
    })
      .select({ _id: 1, name: 1, logoUrl: 1 })
      .lean();

    const myCommIds = myCommunities.map((c) => c._id);
    const dmAsOwner = [];

    if (myCommIds.length) {
      const members = await CommunityMember.find({
        communityId: { $in: myCommIds },
        userId: { $ne: meId },
      })
        .select({ communityId: 1, userId: 1 })
        .lean();

      const memberIds = [...new Set(members.map((m) => String(m.userId)))].map(
        toId
      );
      const users = memberIds.length
        ? await User.find({ _id: { $in: memberIds } })
            .select({ _id: 1, name: 1, avatarUrl: 1 })
            .lean()
        : [];

      const myCommById = {};
      myCommunities.forEach((c) => {
        myCommById[String(c._id)] = c;
      });

      const userById = {};
      users.forEach((u) => {
        userById[String(u._id)] = u;
      });

      members.forEach((m) => {
        const comm = myCommById[String(m.communityId)] || {};
        const u = userById[String(m.userId)] || {};
        dmAsOwner.push({
          id: `priv:${m.communityId}:${meId}:${m.userId}`,
          type: "private",
          lastMessageAt: null,
          unreadCount: 0,
          lastMessage: null,
          private: {
            community: {
              name: comm.name || "Communauté",
              logoUrl: comm.logoUrl || "",
            },
            owner: { id: String(meId) },
            member: {
              id: String(m.userId),
              name: u.name || "Membre",
              avatar: u.avatarUrl || "",
            },
          },
        });
      });
    }

    // ---- 3) Groupes (mes inscriptions formations) ----
    const myEnrolls = await CourseEnrollment.find({ userId: meId })
      .select({ courseId: 1 })
      .lean();

    const courseIds = myEnrolls.map((e) => e.courseId);

    const courses = courseIds.length
      ? await Course.find({ _id: { $in: courseIds } })
          .select({ _id: 1, title: 1, communityId: 1, ownerId: 1, groupId: 1 })
          .lean()
      : [];

    const groupIds = [
      ...new Set(courses.map((c) => String(c.groupId)).filter(Boolean)),
    ].map(toId);
    const groupsById = {};
    if (groupIds.length) {
      const groups = await Group.find({
        _id: { $in: groupIds },
        deletedAt: null,
      })
        .select({ _id: 1, name: 1, avatarUrl: 1 })
        .lean();
      groups.forEach((g) => {
        groupsById[String(g._id)] = g;
      });
    }

    const groupThreads = courses.map((c) => {
      const g = c.groupId ? groupsById[String(c.groupId)] : null;
      const name = g?.name || c.title || "Groupe de formation";
      const avatarUrl = g?.avatarUrl || "";
      const gid = g?._id || c.groupId || c._id; // identifiant stable
      return {
        id: `grp:${gid}`,
        type: "group",
        lastMessageAt: null,
        unreadCount: 0,
        lastMessage: null,
        group: { name, avatarUrl },
      };
    });

    const items = [...dmAsMember, ...dmAsOwner, ...groupThreads];
    return res.json({ ok: true, data: { items } });
  } catch (e) {
    console.error("[messages/threads] error", e);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
};
