import prisma from "../lib/prisma.js";
import institutions from "./institutionsController.js";
const { searchInstitutions } = institutions;

const toTitleCase = (s) =>
  s
    ? s
        .trim()
        .replace(
          /\w\S*/g,
          (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
        )
    : null;

const userSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  avatar: true,
  bio: true,
  institution: true,
  institutionType: true,
  city: true,
  state: true,
  saleNotifications: true,
  messageNotifications: true,
  priceDropAlerts: true,
  theme: true,
  sellerIdVerified: true,
  sellerVideoVerified: true,
  sellerVerificationExpiresAt: true,
  profileComplete: true,
  authProvider: true,
  createdAt: true,
};

const getVerificationStatusPayload = (user) => {
  const now = new Date();
  const expiresAt = user?.sellerVerificationExpiresAt || null;
  const isExpired = expiresAt ? new Date(expiresAt) < now : true;
  const isVerified = Boolean(user?.sellerIdVerified && !isExpired);

  return {
    sellerIdVerified: Boolean(user?.sellerIdVerified),
    sellerVideoVerified: Boolean(user?.sellerVideoVerified),
    sellerVerificationExpiresAt: expiresAt,
    sellerVerificationExpired: isExpired,
    sellerVerificationStatus: isVerified ? "verified" : "pending",
  };
};

// GET /users/me
export const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: userSelect,
    });
    if (!user) return res.status(404).json({ error: "User not found." });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch profile." });
  }
};

// GET /users/seller-verification/status
export const getSellerVerificationStatus = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        sellerIdVerified: true,
        sellerVideoVerified: true,
        sellerVerificationExpiresAt: true,
      },
    });

    if (!user) return res.status(404).json({ error: "User not found." });
    res.json(getVerificationStatusPayload(user));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch verification status." });
  }
};

// POST /users/seller-verification
export const submitSellerVerification = async (req, res) => {
  const { idDocumentUrl } = req.body;

  if (!idDocumentUrl) {
    return res.status(400).json({
      error: "idDocumentUrl is required.",
    });
  }

  try {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90);

    const updated = await prisma.user.update({
      where: { id: req.user.userId },
      data: {
        sellerIdVerified: true,
        // Keep legacy flag aligned while ID-only verification is active.
        sellerVideoVerified: true,
        sellerVerificationExpiresAt: expiresAt,
      },
      select: userSelect,
    });

    res.json({
      message: "Seller verification submitted successfully.",
      verification: getVerificationStatusPayload(updated),
      user: updated,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to submit seller verification." });
  }
};

// PUT /users/profile
export const updateProfile = async (req, res) => {
  const {
    firstName,
    lastName,
    phone,
    avatar,
    bio,
    institution,
    institutionType,
    city,
    state,
    saleNotifications,
    messageNotifications,
    priceDropAlerts,
    theme,
  } = req.body;

  const validThemes = ["ember", "midnight", "chalk"];
  if (theme && !validThemes.includes(theme))
    return res.status(400).json({ error: "Invalid theme." });

  const validTypes = ["college", "school"];
  if (institutionType && !validTypes.includes(institutionType))
    return res
      .status(400)
      .json({ error: "institutionType must be college or school." });

  try {
    const updated = await prisma.user.update({
      where: { id: req.user.userId },
      data: {
        ...(firstName !== undefined && { firstName: firstName.trim() }),
        ...(lastName !== undefined && { lastName: lastName.trim() }),
        ...(phone !== undefined && { phone: phone?.trim() || null }),
        ...(avatar !== undefined && { avatar }),
        ...(bio !== undefined && { bio: bio?.trim() || null }),
        ...(institution !== undefined && {
          institution: institution?.trim() || null,
        }),
        ...(institutionType !== undefined && { institutionType }),
        ...(city !== undefined && { city: toTitleCase(city) || null }),
        ...(state !== undefined && { state: toTitleCase(state) || null }),
        ...(saleNotifications !== undefined && {
          saleNotifications: Boolean(saleNotifications),
        }),
        ...(messageNotifications !== undefined && {
          messageNotifications: Boolean(messageNotifications),
        }),
        ...(priceDropAlerts !== undefined && {
          priceDropAlerts: Boolean(priceDropAlerts),
        }),
        ...(theme !== undefined && { theme }),
        ...(institution?.trim() && { profileComplete: true }),
      },
      select: userSelect,
    });

    if (institution?.trim()) {
      try {
        const localMatch = searchInstitutions(
          institution.trim(),
          "all",
          1,
        ).find(
          (i) => i.name.toLowerCase() === institution.trim().toLowerCase(),
        );
        if (!localMatch) {
          await prisma.suggestedInstitution.upsert({
            where: { name: institution.trim() },
            update: { count: { increment: 1 } },
            create: {
              name: institution.trim(),
              city: city?.trim() || "",
              state: state?.trim() || "",
              type: institutionType || "college",
            },
          });
        }
      } catch {}
    }

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update profile." });
  }
};

// PUT /users/complete-profile
export const completeProfile = async (req, res) => {
  const { phone, institution, institutionType, city, state } = req.body;

  if (!institution?.trim())
    return res.status(400).json({ error: "Institution is required." });
  if (!institutionType)
    return res.status(400).json({ error: "Institution type is required." });

  try {
    const updated = await prisma.user.update({
      where: { id: req.user.userId },
      data: {
        phone: phone?.trim() || null,
        institution: institution.trim(),
        institutionType,
        city: toTitleCase(city) || null,
        state: toTitleCase(state) || null,
        profileComplete: true,
      },
      select: userSelect,
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to complete profile." });
  }
};

// DELETE /users/account
export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.userId;
    await prisma.notification.deleteMany({ where: { userId } });
    await prisma.cartItem.deleteMany({ where: { userId } });
    await prisma.message.deleteMany({
      where: { OR: [{ senderId: userId }, { receiverId: userId }] },
    });
    await prisma.transaction.deleteMany({
      where: { OR: [{ buyerId: userId }, { sellerId: userId }] },
    });
    await prisma.item.deleteMany({ where: { sellerId: userId } });
    await prisma.user.delete({ where: { id: userId } });
    res.json({ message: "Account deleted." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete account." });
  }
};

// POST /users/create-password
export const createPassword = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 8)
      return res.status(400).json({ error: "Min 8 characters." });
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: "User not found." });
    const bcrypt = await import("bcrypt");
    const hash = await bcrypt.default.hash(newPassword, 12);
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { password: hash, authProvider: "both" },
      select: userSelect,
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create password." });
  }
};

// GET /users/search?q=&type=&limit=
export const searchUsers = async (req, res) => {
  try {
    const { q, type, limit = 50 } = req.query;

    const users = await prisma.user.findMany({
      where: {
        AND: [
          ...(q
            ? [
                {
                  OR: [
                    { firstName: { contains: q, mode: "insensitive" } },
                    { lastName: { contains: q, mode: "insensitive" } },
                    { institution: { contains: q, mode: "insensitive" } },
                    { city: { contains: q, mode: "insensitive" } },
                    { state: { contains: q, mode: "insensitive" } },
                  ],
                },
              ]
            : []),
          ...(type && type !== "all" ? [{ institutionType: type }] : []),
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatar: true,
        institution: true,
        institutionType: true,
        city: true,
        state: true,
        createdAt: true,
      },
      take: parseInt(limit),
      orderBy: { createdAt: "desc" },
    });

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to search users" });
  }
};

// GET /users/search-by-item?item=&q=&type=&limit=
export const searchUsersByItem = async (req, res) => {
  try {
    const { item, q, type, limit = 50 } = req.query;
    if (!item) return res.json([]);

    const items = await prisma.item.findMany({
      where: {
        title: { contains: item, mode: "insensitive" },
      },
      select: {
        id: true,
        title: true,
        price: true,
        status: true,
        category: true,
        condition: true,
        images: true,
        imageUrl: true,
        sellerId: true,
        seller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            institution: true,
            institutionType: true,
            city: true,
            state: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: parseInt(limit),
    });

    const sellerMap = new Map();
    for (const itm of items) {
      const sid = itm.seller.id;

      // Filter by people query (name/institution/city/state)
      if (q) {
        const ql = q.toLowerCase();
        const s = itm.seller;
        const matches =
          s.firstName?.toLowerCase().includes(ql) ||
          s.lastName?.toLowerCase().includes(ql) ||
          s.institution?.toLowerCase().includes(ql) ||
          s.city?.toLowerCase().includes(ql) ||
          s.state?.toLowerCase().includes(ql);
        if (!matches) continue;
      }

      // Filter by institution type
      if (type && type !== "all" && itm.seller.institutionType !== type)
        continue;

      if (!sellerMap.has(sid)) {
        sellerMap.set(sid, { ...itm.seller, matchedItems: [] });
      }
      sellerMap.get(sid).matchedItems.push({
        id: itm.id,
        title: itm.title,
        price: itm.price,
        status: itm.status,
        category: itm.category,
        images: itm.images,
        imageUrl: itm.imageUrl,
      });
    }

    res.json(Array.from(sellerMap.values()));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to search by item" });
  }
};

// GET /users/:id/profile — public profile
export const getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatar: true,
        bio: true,
        institution: true,
        institutionType: true,
        city: true,
        state: true,
        createdAt: true,
      },
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    const listings = await prisma.item.findMany({
      where: { sellerId: parseInt(id), status: "available" },
      select: {
        id: true,
        title: true,
        price: true,
        category: true,
        condition: true,
        images: true,
        imageUrl: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const soldItems = await prisma.item.findMany({
      where: { sellerId: parseInt(id), status: "sold" },
      select: {
        id: true,
        title: true,
        price: true,
        category: true,
        condition: true,
        images: true,
        imageUrl: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const reviews = await prisma.review.findMany({
      where: { revieweeId: parseInt(id) },
      include: {
        reviewer: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const avgRating = reviews.length
      ? parseFloat(
          (
            reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          ).toFixed(1),
        )
      : null;

    res.json({ user, listings, soldItems, reviews, averageRating: avgRating });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get user profile" });
  }
};
