import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useSearchParams } from "react-router-dom";
import API from "../api/axios";
import { getSocket } from "../socket";

const categories = [
  "Books & Notes",
  "Electronics",
  "Food & Drinks",
  "Clothing",
  "Furniture",
  "Sports & Fitness",
  "Stationery",
  "Appliances",
  "Games & Hobbies",
  "Services",
  "Other",
];
const conditions = ["New", "Like New", "Good", "Fair", "Poor"];
const statuses = ["available", "pending"];

const SPEC_FIELDS = {
  Electronics: [
    { key: "brand", label: "Brand" },
    { key: "ram", label: "RAM" },
    { key: "storage", label: "Storage" },
    { key: "processor", label: "Processor" },
    { key: "display", label: "Display" },
  ],
  Clothing: [
    { key: "gender", label: "Gender" },
    { key: "color", label: "Color" },
    { key: "type", label: "Type" },
  ],
  "Books & Notes": [
    { key: "subject", label: "Subject" },
    { key: "author", label: "Author" },
    { key: "edition", label: "Edition" },
  ],
  Furniture: [
    { key: "material", label: "Material" },
    { key: "color", label: "Color" },
    { key: "dimensions", label: "Dimensions" },
  ],
  "Sports & Fitness": [
    { key: "sport", label: "Sport" },
    { key: "brand", label: "Brand" },
    { key: "size", label: "Size" },
  ],
  Stationery: [
    { key: "type", label: "Type" },
    { key: "brand", label: "Brand" },
  ],
  Appliances: [
    { key: "brand", label: "Brand" },
    { key: "capacity", label: "Capacity" },
    { key: "color", label: "Color" },
  ],
  "Games & Hobbies": [
    { key: "platform", label: "Platform" },
    { key: "type", label: "Type" },
    { key: "brand", label: "Brand" },
  ],
  Services: [
    { key: "mode", label: "Mode" },
    { key: "experience", label: "Experience" },
  ],
  "Food & Drinks": [
    { key: "type", label: "Type" },
    { key: "ingredients", label: "Ingredients" },
    { key: "allergens", label: "Allergens" },
  ],
  Other: [],
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "pending", label: "Pending" },
  { key: "sold", label: "Sold" },
];

// ── Spec Validators (mirrored from PostItem) ──────────────────
const pureNum = (v) => /^\d+$/.test(v.trim());
const startsSpecial = (v) => /^[^a-zA-Z0-9]/.test(v.trim());
const badStart = (v) =>
  startsSpecial(v) ? "Can't start with a special character" : null;
const SPEC_VALIDATORS = {
  Electronics: {
    brand: (v) =>
      badStart(v) ||
      (pureNum(v) ? "Enter a brand name" : v.length < 2 ? "Too short" : null),
    ram: (v) =>
      badStart(v) ||
      (!/^\d+\s*(gb|tb|mb)/i.test(v.trim()) ? "e.g. 8GB, 16GB" : null),
    storage: (v) =>
      badStart(v) ||
      (!/^\d+\s*(gb|tb|mb)/i.test(v.trim()) ? "e.g. 256GB, 1TB" : null),
    processor: (v) =>
      badStart(v) ||
      (pureNum(v) ? "Enter processor name" : v.length < 2 ? "Too short" : null),
    display: (v) => badStart(v) || (pureNum(v) ? 'e.g. 15.6", 4K OLED' : null),
  },
  Clothing: {
    gender: (v) =>
      badStart(v) ||
      (!/[a-zA-Z]/.test(v) ? "Enter gender — e.g. Male, Female" : null),
    color: (v) =>
      badStart(v) ||
      (pureNum(v) ? "Enter a color name" : v.length < 4 ? "Too short" : null),
    type: (v) =>
      badStart(v) ||
      (pureNum(v) ? "Enter clothing type" : v.length < 4 ? "Too short" : null),
  },
  "Books & Notes": {
    subject: (v) =>
      badStart(v) ||
      (pureNum(v)
        ? "Enter subject name"
        : !/^[a-zA-Z]/.test(v.trim())
          ? "Must start with a letter"
          : v.length < 5
            ? "Too short"
            : null),
    author: (v) =>
      badStart(v) ||
      (pureNum(v)
        ? "Enter author name"
        : !/^[a-zA-Z]/.test(v.trim())
          ? "Must start with a letter"
          : v.length < 5
            ? "Too short"
            : null),
  },
  Furniture: {
    material: (v) =>
      badStart(v) ||
      (pureNum(v) ? "Enter material name" : v.length < 2 ? "Too short" : null),
    color: (v) =>
      badStart(v) ||
      (pureNum(v) ? "Enter a color name" : v.length < 2 ? "Too short" : null),
    dimensions: (v) =>
      badStart(v) || (pureNum(v) ? "Add a unit — e.g. 120x60 cm" : null),
  },
  "Sports & Fitness": {
    sport: (v) =>
      badStart(v) ||
      (pureNum(v) ? "Enter sport name" : v.length < 2 ? "Too short" : null),
    brand: (v) =>
      badStart(v) ||
      (pureNum(v) ? "Enter a brand name" : v.length < 2 ? "Too short" : null),
  },
  Stationery: {
    type: (v) =>
      badStart(v) ||
      (pureNum(v) ? "Enter item type" : v.length < 2 ? "Too short" : null),
    brand: (v) =>
      badStart(v) ||
      (pureNum(v) ? "Enter a brand name" : v.length < 2 ? "Too short" : null),
  },
  Appliances: {
    brand: (v) =>
      badStart(v) ||
      (pureNum(v) ? "Enter a brand name" : v.length < 2 ? "Too short" : null),
    capacity: (v) =>
      badStart(v) ||
      (!/^\d+\s*(l|ltr|litre|kg|kgs|g|ml|w|kw)/i.test(v.trim())
        ? "e.g. 5kg, 200L"
        : null),
    color: (v) =>
      badStart(v) ||
      (pureNum(v) ? "Enter a color name" : v.length < 2 ? "Too short" : null),
  },
  "Games & Hobbies": {
    platform: (v) =>
      badStart(v) || (pureNum(v) ? "e.g. PS5, PC, Switch" : null),
    type: (v) =>
      badStart(v) ||
      (pureNum(v) ? "Enter genre name" : v.length < 2 ? "Too short" : null),
    brand: (v) =>
      badStart(v) ||
      (pureNum(v) ? "Enter a brand name" : v.length < 2 ? "Too short" : null),
  },
  "Food & Drinks": {
    type: (v) =>
      badStart(v) ||
      (!/[a-zA-Z]/.test(v)
        ? "Enter a food type"
        : v.length < 2
          ? "Too short"
          : null),
    ingredients: (v) =>
      badStart(v) ||
      (!/[a-zA-Z]/.test(v)
        ? "Enter ingredients"
        : v.length < 2
          ? "Too short"
          : null),
    allergens: (v) =>
      badStart(v) ||
      (!/[a-zA-Z]/.test(v)
        ? "e.g. Nuts, Dairy, None"
        : v.length < 2
          ? "Too short"
          : null),
    diet: (v) =>
      badStart(v) ||
      (!/[a-zA-Z]/.test(v)
        ? "e.g. Vegetarian, Vegan"
        : v.length < 2
          ? "Too short"
          : null),
    contains: (v) =>
      badStart(v) ||
      (!/[a-zA-Z]/.test(v)
        ? "e.g. Nuts, Dairy"
        : v.length < 2
          ? "Too short"
          : null),
  },
  Services: {
    mode: (v) =>
      badStart(v) || (!/[a-zA-Z]/.test(v) ? "e.g. Online, Offline" : null),
    experience: (v) =>
      badStart(v) ||
      (!/[a-zA-Z]/.test(v)
        ? "e.g. 2 years, Expert"
        : v.length < 2
          ? "Too short"
          : null),
  },
};

const specFieldsMap = {
  Electronics: [
    { key: "brand", label: "Brand", placeholder: "e.g. Dell, Apple, Samsung" },
    { key: "ram", label: "RAM", placeholder: "e.g. 8GB, 16GB" },
    { key: "storage", label: "Storage", placeholder: "e.g. 256GB, 1TB" },
    { key: "processor", label: "Processor", placeholder: "e.g. Intel i5, M2" },
    { key: "display", label: "Display", placeholder: 'e.g. 15.6", 4K OLED' },
  ],
  Clothing: [
    {
      key: "gender",
      label: "Gender",
      placeholder: "e.g. Male, Female, Unisex",
    },
    { key: "color", label: "Color", placeholder: "e.g. Black, Navy Blue" },
    { key: "type", label: "Type", placeholder: "e.g. T-shirt, Jeans" },
  ],
  "Books & Notes": [
    { key: "subject", label: "Subject", placeholder: "e.g. Physics, Maths" },
    { key: "author", label: "Author", placeholder: "e.g. H.C. Verma" },
    { key: "edition", label: "Edition", placeholder: "e.g. 3rd Edition 2023" },
  ],
  Furniture: [
    {
      key: "material",
      label: "Material",
      placeholder: "e.g. Solid Wood, Metal",
    },
    { key: "color", label: "Color", placeholder: "e.g. Brown, White" },
    { key: "dimensions", label: "Dimensions", placeholder: "e.g. 120 x 60 cm" },
  ],
  "Sports & Fitness": [
    { key: "sport", label: "Sport", placeholder: "e.g. Cricket, Football" },
    { key: "brand", label: "Brand", placeholder: "e.g. Nike, Adidas, SG" },
    { key: "size", label: "Size", placeholder: "e.g. Size 7, XL" },
  ],
  Stationery: [
    { key: "type", label: "Type", placeholder: "e.g. Notebook, Pen set" },
    { key: "brand", label: "Brand", placeholder: "e.g. Classmate, Natraj" },
  ],
  Appliances: [
    { key: "brand", label: "Brand", placeholder: "e.g. Samsung, LG" },
    { key: "capacity", label: "Capacity", placeholder: "e.g. 5kg, 200L" },
    { key: "color", label: "Color", placeholder: "e.g. White, Silver" },
  ],
  "Games & Hobbies": [
    { key: "platform", label: "Platform", placeholder: "e.g. PS5, PC, Mobile" },
    { key: "type", label: "Type", placeholder: "e.g. Strategy, Action" },
    { key: "brand", label: "Brand", placeholder: "e.g. Sony, Nintendo" },
  ],
  Services: [
    { key: "mode", label: "Mode", placeholder: "e.g. Online, Offline" },
    { key: "experience", label: "Experience", placeholder: "e.g. 2 years" },
  ],
  "Food & Drinks": [
    { key: "type", label: "Type", placeholder: "e.g. Snack, Full Meal" },
    {
      key: "ingredients",
      label: "Ingredients",
      placeholder: "e.g. Rice, Wheat",
    },
    {
      key: "allergens",
      label: "Allergens",
      placeholder: "e.g. Nuts, Dairy, None",
    },
  ],
  Other: [],
};

const specSuggestionsMap = {
  Electronics: {
    brand: [
      "Apple",
      "Dell",
      "HP",
      "Lenovo",
      "Samsung",
      "Sony",
      "Asus",
      "Acer",
      "Microsoft",
      "LG",
      "OnePlus",
      "Xiaomi",
    ],
    ram: ["2GB", "4GB", "6GB", "8GB", "12GB", "16GB", "32GB", "64GB"],
    storage: ["64GB", "128GB", "256GB", "512GB", "1TB", "2TB"],
    processor: [
      "Intel i3",
      "Intel i5",
      "Intel i7",
      "Intel i9",
      "AMD Ryzen 5",
      "AMD Ryzen 7",
      "Apple M1",
      "Apple M2",
      "Apple M3",
      "Snapdragon",
    ],
    display: [
      '11"',
      '13"',
      '14"',
      '15.6"',
      '16"',
      "Full HD",
      "4K",
      "OLED",
      "Retina Display",
    ],
  },
  Clothing: {
    gender: ["Male", "Female", "Unisex", "Kids"],
    color: [
      "Black",
      "White",
      "Navy Blue",
      "Grey",
      "Red",
      "Green",
      "Brown",
      "Beige",
      "Multicolor",
    ],
    type: [
      "T-shirt",
      "Shirt",
      "Jeans",
      "Trousers",
      "Jacket",
      "Hoodie",
      "Kurta",
      "Saree",
      "Shorts",
      "Dress",
      "Sweater",
    ],
  },
  "Books & Notes": {
    subject: [
      "Physics",
      "Chemistry",
      "Mathematics",
      "Biology",
      "English",
      "Computer Science",
      "Economics",
      "History",
      "Geography",
    ],
    author: [
      "H.C. Verma",
      "R.D. Sharma",
      "S.L. Arora",
      "NCERT",
      "Arihant",
      "DC Pandey",
      "P.K. Nag",
    ],
    edition: [
      "1st Edition",
      "2nd Edition",
      "3rd Edition",
      "4th Edition",
      "2022 Edition",
      "2023 Edition",
      "2024 Edition",
      "Latest Edition",
    ],
  },
  Furniture: {
    material: [
      "Wood",
      "Solid Wood",
      "Plywood",
      "Metal",
      "Steel",
      "Plastic",
      "Glass",
      "Cane",
      "MDF",
    ],
    color: [
      "Brown",
      "White",
      "Black",
      "Natural Wood",
      "Walnut",
      "Oak",
      "Mahogany",
    ],
    dimensions: [
      "Single Bed (90x190cm)",
      "Double Bed (120x190cm)",
      "2-Seater",
      "3-Seater",
      "4-Seater",
      "L-Shaped",
    ],
  },
  "Sports & Fitness": {
    sport: [
      "Cricket",
      "Football",
      "Basketball",
      "Badminton",
      "Tennis",
      "Table Tennis",
      "Gym",
      "Yoga",
      "Cycling",
      "Swimming",
    ],
    brand: [
      "Nike",
      "Adidas",
      "Puma",
      "Reebok",
      "SG",
      "MRF",
      "Yonex",
      "Decathlon",
      "Under Armour",
    ],
    size: [
      "XS",
      "S",
      "M",
      "L",
      "XL",
      "Size 3",
      "Size 4",
      "Size 5",
      "Size 6",
      "Size 7",
    ],
  },
  Stationery: {
    type: [
      "Notebook",
      "Pen Set",
      "Pencil Set",
      "Marker Set",
      "Geometry Box",
      "Art Kit",
      "Calculator",
      "Highlighters",
      "Sticky Notes",
    ],
    brand: [
      "Classmate",
      "Natraj",
      "Camlin",
      "Reynolds",
      "Cello",
      "Faber-Castell",
      "Staedtler",
      "Casio",
    ],
  },
  Appliances: {
    brand: [
      "Samsung",
      "LG",
      "Whirlpool",
      "Haier",
      "Godrej",
      "Voltas",
      "IFB",
      "Bosch",
      "Bajaj",
      "Philips",
    ],
    capacity: [
      "5L",
      "10L",
      "15L",
      "5kg",
      "6.5kg",
      "7kg",
      "8kg",
      "150L",
      "200L",
      "250L",
      "300L",
    ],
    color: ["White", "Silver", "Black", "Graphite", "Grey"],
  },
  "Games & Hobbies": {
    platform: [
      "PS4",
      "PS5",
      "Xbox One",
      "Xbox Series X",
      "PC",
      "Nintendo Switch",
      "Mobile",
      "Board Game",
    ],
    type: [
      "Action",
      "Strategy",
      "RPG",
      "Sports",
      "Racing",
      "Puzzle",
      "Adventure",
      "Simulation",
      "FPS",
    ],
    brand: [
      "Sony",
      "Microsoft",
      "Nintendo",
      "EA",
      "Ubisoft",
      "Activision",
      "Hasbro",
    ],
  },
  Services: {
    mode: ["Online", "Offline", "Both Online & Offline"],
    experience: [
      "Beginner",
      "6 Months",
      "1 Year",
      "2 Years",
      "3+ Years",
      "Expert",
    ],
  },
  "Food & Drinks": {
    type: [
      "Snack",
      "Full Meal",
      "Dessert",
      "Beverage",
      "Breakfast",
      "Homemade",
      "Packaged",
    ],
    ingredients: [
      "Rice",
      "Wheat",
      "Lentils",
      "Vegetables",
      "Chicken",
      "Milk",
      "Sugar",
    ],
    allergens: [
      "No Allergens",
      "Nuts",
      "Dairy",
      "Gluten",
      "Soy",
      "Eggs",
      "Shellfish",
    ],
  },
};

function safeDate(val) {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}
function getTimestamp(obj) {
  return obj?.createdAt || obj?.created_at || null;
}
function formatDate(obj) {
  const raw = typeof obj === "string" ? obj : getTimestamp(obj);
  const d = safeDate(raw);
  if (!d) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
function formatTime(obj) {
  const raw = typeof obj === "string" ? obj : getTimestamp(obj);
  const d = safeDate(raw);
  if (!d) return "";
  return d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

// ── ConfirmDeleteModal ────────────────────────────────────────
function ConfirmDeleteModal({ title, onConfirm, onCancel }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter") onConfirm();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onConfirm, onCancel]);

  return createPortal(
    <div
      onClick={onCancel}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        animation: "cdFadeIn 0.18s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--glass-bg-modal)",
          backdropFilter: "blur(24px)",
          border: "1px solid var(--border-hover)",
          borderRadius: "20px",
          padding: "2rem",
          width: "380px",
          maxWidth: "90vw",
          boxShadow: "0 40px 80px rgba(0,0,0,0.35)",
          position: "relative",
          overflow: "hidden",
          animation: "cdSlideUp 0.22s cubic-bezier(0.175,0.885,0.32,1.275)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "1px",
            background:
              "linear-gradient(90deg, transparent, rgba(255,107,107,0.4), transparent)",
          }}
        />

        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "14px",
            margin: "0 auto 1.25rem",
            background: "rgba(255,107,107,0.1)",
            border: "1px solid rgba(255,107,107,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ff6b6b"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14H6L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4h6v2" />
          </svg>
        </div>

        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div
            style={{
              fontSize: "1rem",
              fontWeight: "800",
              color: "var(--text-primary)",
              marginBottom: "0.5rem",
              letterSpacing: "-0.3px",
            }}
          >
            Delete listing?
          </div>
          <div
            style={{
              fontSize: "0.82rem",
              color: "var(--text-muted)",
              lineHeight: "1.5",
            }}
          >
            <span style={{ color: "var(--text-secondary)", fontWeight: "600" }}>
              "{title}"
            </span>{" "}
            will be permanently removed along with its images. This cannot be
            undone.
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.65rem" }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: "0.75rem",
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: "700",
              color: "var(--text-muted)",
              transition: "all 0.2s ease",
              fontFamily: "var(--font-body)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--bg-card-hover)";
              e.currentTarget.style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--bg-card)";
              e.currentTarget.style.color = "var(--text-muted)";
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: "0.75rem",
              background:
                "linear-gradient(135deg, rgba(255,107,107,0.9), rgba(220,53,69,0.9))",
              border: "none",
              borderRadius: "12px",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: "700",
              color: "white",
              transition: "all 0.2s ease",
              boxShadow: "0 4px 15px rgba(255,107,107,0.25)",
              fontFamily: "var(--font-body)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow =
                "0 8px 20px rgba(255,107,107,0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow =
                "0 4px 15px rgba(255,107,107,0.25)";
            }}
          >
            Delete
          </button>
        </div>

        <style>{`
          @keyframes cdFadeIn  { from{opacity:0} to{opacity:1} }
          @keyframes cdSlideUp { from{opacity:0;transform:translateY(16px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
          @keyframes dashMove { from { stroke-dashoffset: 0 } to { stroke-dashoffset: -600 } }
        `}</style>
      </div>
    </div>,
    document.body,
  );
}

// ── SoldGroupRow ──────────────────────────────────────────────
function SoldGroupRow({
  group,
  isNewSale,
  isHighlighted,
  onDelete,
  stableKey,
  selectMode,
  selected,
  onToggle,
  gridSize = 1,
}) {
  const navigate = useNavigate();
  const rowRef = useRef(null);

  const item = group.item;
  const sales = group.sales;
  const itemId = group.groupKey;

  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [deleteHovered, setDeleteHovered] = useState(false);
  const [relistHovered, setRelistHovered] = useState(false);
  const [showNew, setShowNew] = useState(isNewSale);
  const [flash, setFlash] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (isHighlighted) {
      setExpanded(true);
      setFlash(true);
      const t1 = setTimeout(
        () =>
          rowRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          }),
        100,
      );
      const t2 = setTimeout(() => setFlash(false), 2000);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [isHighlighted]);

  useEffect(() => {
    if (isNewSale) setExpanded(true);
  }, [isNewSale]);
  useEffect(() => {
    if (!isNewSale) return;
    const t = setTimeout(() => setShowNew(false), 2000);
    return () => clearTimeout(t);
  }, [isNewSale]);

  function handleDeleteClick() {
    setShowConfirm(true);
  }

  async function handleConfirmDelete() {
    setShowConfirm(false);
    const deleteId = item?.id ?? itemId;
    onDelete(deleteId, stableKey);
    if (deleteId) {
      try {
        await API.delete(`/items/${deleteId}`);
      } catch (err) {
        alert(err.response?.data?.error || "Failed to delete.");
      }
    }
  }

  const displayTitle = item?.title || sales[0]?.item_title || "Deleted item";
  const displayPrice = item?.price || sales[0]?.price || "—";
  const displayCategory = item?.category || sales[0]?.item_category || "";
  const listedRaw = item?.createdAt || item?.created_at || null;
  const listedDate = safeDate(listedRaw);

  return (
    <>
      {showConfirm && (
        <ConfirmDeleteModal
          title={displayTitle}
          onConfirm={handleConfirmDelete}
          onCancel={() => setShowConfirm(false)}
        />
      )}
      <div
        ref={rowRef}
        style={{
          background: flash
            ? "linear-gradient(135deg, rgba(var(--accent-rgb),0.12) 0%, rgba(var(--accent-rgb),0.04) 100%)"
            : selected
              ? "linear-gradient(135deg, rgba(var(--accent-rgb),0.12) 0%, rgba(var(--accent-rgb),0.04) 100%)"
              : showNew
                ? "linear-gradient(135deg, rgba(81,207,102,0.08) 0%, rgba(255,255,255,0.02) 100%)"
                : "linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)",
          backdropFilter: "blur(20px)",
          border: flash
            ? "1px solid var(--accent)"
            : selected
              ? "1px solid rgba(var(--accent-rgb),0.3)"
              : showNew
                ? "1px solid rgba(81,207,102,0.25)"
                : hovered
                  ? "1px solid rgba(255,255,255,0.16)"
                  : "1px solid rgba(255,255,255,0.09)",
          borderRadius: "16px",
          overflow: "hidden",
          transition: "all 0.4s ease",
          boxShadow: flash
            ? "var(--shadow-accent)"
            : showNew
              ? "0 4px 20px rgba(81,207,102,0.1)"
              : hovered
                ? "0 8px 30px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)"
                : "0 4px 20px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.05)",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => {
          if (selectMode) onToggle();
        }}
      >
        <div
          style={{
            height: "1px",
            background: flash
              ? "linear-gradient(90deg, transparent, var(--accent), transparent)"
              : showNew
                ? "linear-gradient(90deg, transparent, rgba(81,207,102,0.3), transparent)"
                : "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)",
          }}
        />

        <div
          className="sold-row-inner"
          style={{
            flexDirection: gridSize === 1 ? "row" : "column",
            alignItems: gridSize === 1 ? "center" : "flex-start",
            gap: gridSize === 1 ? "1.25rem" : "1rem",
          }}
        >
          {/* Checkbox */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              onToggle && onToggle();
            }}
            style={{
              width: "20px",
              height: "20px",
              borderRadius: "6px",
              flexShrink: 0,
              border: selected ? "none" : "1.5px solid var(--border-hover)",
              background: selected
                ? "linear-gradient(135deg, var(--accent), var(--accent-alt))"
                : "var(--bg-surface)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease",
              boxShadow: selected
                ? "0 2px 10px rgba(var(--accent-rgb),0.45)"
                : "none",
              opacity: hovered || selectMode ? 1 : 0,
              transform: hovered || selectMode ? "scale(1)" : "scale(0.7)",
              pointerEvents: hovered || selectMode ? "auto" : "none",
              cursor: "pointer",
            }}
          >
            {selected && (
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <polyline
                  points="2,6 5,9 10,3"
                  stroke="white"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
          {item?.images?.[0] && (
            <div
              style={{
                width: gridSize === 1 ? "50px" : "100%",
                height: gridSize === 1 ? "50px" : "150px",
                borderRadius: "12px",
                overflow: "hidden",
                flexShrink: 0,
                border: "1px solid var(--border)",
                background: "var(--bg-card)",
              }}
            >
              <img
                src={item.images[0]}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
          )}
          <div
            style={{
              flex: 1,
              minWidth: 0,
              width: gridSize === 1 ? "auto" : "100%",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                marginBottom: "0.4rem",
                flexWrap: "wrap",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: gridSize === 1 ? "1.05rem" : "1.1rem",
                  fontWeight: "700",
                  color: "var(--text-primary)",
                  letterSpacing: "-0.3px",
                  wordBreak: "break-word",
                  lineHeight: "1.3",
                }}
              >
                {displayTitle}
              </h3>
              <div
                style={{
                  fontSize: "0.62rem",
                  fontWeight: "700",
                  padding: "2px 8px",
                  borderRadius: "20px",
                  background: "rgba(255,107,107,0.1)",
                  color: "#ff6b6b",
                  border: "1px solid rgba(255,107,107,0.15)",
                  whiteSpace: "nowrap",
                }}
              >
                Sold {sales.reduce((sum, s) => sum + (s.quantity || 1), 0)}×
              </div>
              {showNew && !flash && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    background:
                      "linear-gradient(135deg, rgba(81,207,102,0.15), rgba(64,192,87,0.1))",
                    border: "1px solid rgba(81,207,102,0.35)",
                    color: "#51cf66",
                    fontSize: "0.62rem",
                    fontWeight: "700",
                    padding: "2px 8px",
                    borderRadius: "20px",
                    animation: "pulse-green 2.5s ease-in-out infinite",
                  }}
                >
                  <svg
                    width="9"
                    height="9"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#51cf66"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  New Sale
                </div>
              )}
              {flash && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    background: "var(--accent-soft)",
                    border: "1px solid var(--accent-border)",
                    color: "var(--accent)",
                    fontSize: "0.62rem",
                    fontWeight: "700",
                    padding: "2px 8px",
                    borderRadius: "20px",
                  }}
                >
                  <svg
                    width="9"
                    height="9"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  Viewing
                </div>
              )}
            </div>
            <div className="sold-row-meta">
              <span
                style={{
                  fontWeight: "800",
                  fontSize: "0.95rem",
                  background:
                    "linear-gradient(135deg, var(--accent), var(--accent-alt))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                ₹{Number(displayPrice).toLocaleString("en-IN")}
              </span>
              {displayCategory && (
                <>
                  <span
                    style={{
                      width: "3px",
                      height: "3px",
                      borderRadius: "50%",
                      background: "rgba(255,255,255,0.15)",
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      color: "var(--text-muted)",
                      fontSize: "0.75rem",
                      fontWeight: "600",
                    }}
                  >
                    {displayCategory}
                  </span>
                </>
              )}
              {listedDate && (
                <>
                  <span
                    style={{
                      width: "3px",
                      height: "3px",
                      borderRadius: "50%",
                      background: "rgba(255,255,255,0.15)",
                      flexShrink: 0,
                    }}
                  />
                  <span
                    className="sold-row-date"
                    style={{ color: "var(--text-ghost)", fontSize: "0.72rem" }}
                  >
                    Listed{" "}
                    {listedDate.toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    ·{" "}
                    {listedDate.toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </span>
                </>
              )}
            </div>
          </div>

          <div
            className="sold-row-actions"
            style={{
              width: gridSize === 1 ? "auto" : "100%",
              justifyContent: gridSize === 1 ? "flex-end" : "space-between",
              marginTop: gridSize === 1 ? "0" : "0.5rem",
              gap: "0.5rem",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={() => setExpanded((e) => !e)}
              style={{
                padding: "0.4rem 1rem",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                background: expanded
                  ? "var(--bg-card-hover)"
                  : "var(--bg-card)",
                color: expanded ? "var(--text-primary)" : "var(--text-muted)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                cursor: "pointer",
                fontSize: "0.78rem",
                fontWeight: "600",
                transition: "all 0.2s ease",
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.3s ease",
                }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
              History
            </button>
            <button
              onClick={() =>
                navigate("/post", {
                  state: {
                    prefill: {
                      title: displayTitle,
                      price: displayPrice,
                      category: displayCategory,
                      condition: item?.condition,
                      description: item?.description,
                      images: item?.images || [],
                    },
                  },
                })
              }
              onMouseEnter={() => setRelistHovered(true)}
              onMouseLeave={() => setRelistHovered(false)}
              style={{
                padding: "0.4rem 1rem",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                background: relistHovered
                  ? "var(--accent-soft)"
                  : "var(--bg-card)",
                color: relistHovered ? "var(--accent)" : "var(--text-muted)",
                border: relistHovered
                  ? "1px solid var(--accent-border)"
                  : "1px solid var(--border)",
                borderRadius: "10px",
                cursor: "pointer",
                fontSize: "0.78rem",
                fontWeight: "600",
                transition: "all 0.2s ease",
              }}
            >
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              Relist
            </button>
            <button
              onClick={handleDeleteClick}
              onMouseEnter={() => setDeleteHovered(true)}
              onMouseLeave={() => setDeleteHovered(false)}
              style={{
                padding: "0.4rem 1rem",
                background: deleteHovered
                  ? "rgba(255,107,107,0.2)"
                  : "rgba(255,107,107,0.08)",
                color: deleteHovered ? "#ff6b6b" : "rgba(255,107,107,0.6)",
                border: deleteHovered
                  ? "1px solid rgba(255,107,107,0.25)"
                  : "1px solid rgba(255,107,107,0.1)",
                borderRadius: "10px",
                cursor: "pointer",
                fontSize: "0.78rem",
                fontWeight: "600",
                transition: "all 0.2s ease",
              }}
            >
              Delete
            </button>
          </div>
        </div>

        {expanded && (
          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(0,0,0,0.15)",
              padding: "0.75rem 1.75rem 1rem",
            }}
          >
            <div
              style={{
                fontSize: "0.6rem",
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                color: "var(--text-ghost)",
                fontWeight: "700",
                marginBottom: "0.75rem",
              }}
            >
              Sale History
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              {sales.map((sale, i) => {
                const saleTs = getTimestamp(sale);
                const saleDate = safeDate(saleTs);
                return (
                  <div key={sale.id} className="sale-history-row">
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "1rem",
                      }}
                    >
                      <div
                        style={{
                          width: "22px",
                          height: "22px",
                          borderRadius: "50%",
                          background: "var(--accent-soft)",
                          border: "1px solid var(--accent-border)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.6rem",
                          fontWeight: "800",
                          color: "var(--accent)",
                          flexShrink: 0,
                        }}
                      >
                        {i + 1}
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: "0.82rem",
                            fontWeight: "600",
                            color: "var(--text-secondary)",
                          }}
                        >
                          {sale.buyer_name}
                        </div>
                        <div
                          style={{
                            fontSize: "0.68rem",
                            color: "var(--text-ghost)",
                            marginTop: "1px",
                          }}
                        >
                          Buyer
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{
                          fontSize: "0.88rem",
                          fontWeight: "800",
                          background:
                            "linear-gradient(135deg, var(--accent), var(--accent-alt))",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          backgroundClip: "text",
                        }}
                      >
                        ₹{Number(sale.price).toLocaleString("en-IN")}
                      </div>
                      <div
                        style={{
                          fontSize: "0.68rem",
                          color: "var(--text-ghost)",
                          marginTop: "2px",
                        }}
                      >
                        {saleDate
                          ? `${saleDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} · ${saleDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}`
                          : "—"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <style>{`@keyframes pulse-green { 0%,100% { box-shadow: 0 2px 12px rgba(81,207,102,0.15) } 50% { box-shadow: 0 2px 20px rgba(81,207,102,0.3) } }`}</style>
      </div>
    </>
  );
}

// ── Dropdown components for edit form (same as PostItem) ─────
function EditDropItem({ label, onSelect, isFirst, isLast, active }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseDown={(e) => {
        e.preventDefault();
        onSelect();
      }}
      style={{
        padding: "0.52rem 0.9rem",
        cursor: "pointer",
        fontSize: "0.84rem",
        color: active
          ? "var(--dropdown-item-active)"
          : hovered
            ? "var(--dropdown-item-active)"
            : "var(--dropdown-item-text)",
        background: active
          ? "var(--dropdown-item-active-bg)"
          : hovered
            ? "var(--dropdown-item-hover-bg)"
            : "transparent",
        borderTop: !isFirst ? "1px solid var(--dropdown-divider)" : "none",
        borderRadius: isLast ? "0 0 11px 11px" : "0",
        transition: "all 0.1s ease",
        fontWeight: active || hovered ? "600" : "400",
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
      }}
    >
      {active && (
        <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
          <polyline
            points="1,6 4,9 11,3"
            stroke="var(--dropdown-item-active)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      {!active && <span style={{ width: "9px" }} />}
      {label}
    </div>
  );
}

const editDropMenuStyle = {
  position: "absolute",
  top: "100%",
  left: 0,
  right: 0,
  zIndex: 99999,
  background: "var(--dropdown-bg)",
  border: "1px solid var(--dropdown-border)",
  borderTop: "none",
  borderRadius: "0 0 12px 12px",
  maxHeight: "200px",
  overflowY: "auto",
  boxShadow: "0 20px 48px rgba(0,0,0,0.7)",
};

function EditCustomSelect({
  value,
  onChange,
  options,
  placeholder,
  focusKey,
  focusedField,
  setFocusedField,
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const isFocused = focusedField === focusKey;

  useEffect(() => {
    function handler(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        if (isFocused) setFocusedField(null);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isFocused, setFocusedField]);

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <button
        type="button"
        onMouseDown={() => {
          setFocusedField(open ? null : focusKey);
          setOpen((o) => !o);
        }}
        style={{
          width: "100%",
          padding: "0.7rem 2.5rem 0.7rem 1rem",
          boxSizing: "border-box",
          background: isFocused ? "var(--select-bg-focus)" : "var(--select-bg)",
          border: isFocused
            ? "1px solid var(--accent-border)"
            : "1px solid var(--select-border)",
          borderRadius: open ? "12px 12px 0 0" : "12px",
          color: value ? "var(--text-primary)" : "var(--select-placeholder)",
          fontSize: "0.9rem",
          cursor: "pointer",
          outline: "none",
          textAlign: "left",
          transition: "all 0.2s ease",
          display: "flex",
          alignItems: "center",
          fontFamily: "inherit",
        }}
      >
        <span
          style={{
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {value || placeholder}
        </span>
        <span
          style={{
            position: "absolute",
            right: "0.75rem",
            top: "50%",
            transform: `translateY(-50%) rotate(${open ? 180 : 0}deg)`,
            transition: "transform 0.2s",
            pointerEvents: "none",
          }}
        >
          <svg
            width="11"
            height="11"
            viewBox="0 0 16 16"
            fill="var(--select-arrow)"
          >
            <path d="M8 11L3 6h10z" />
          </svg>
        </span>
      </button>
      {open && (
        <div style={editDropMenuStyle}>
          {options.map((opt, i) => (
            <EditDropItem
              key={opt}
              label={opt}
              active={opt === value}
              isFirst={i === 0}
              isLast={i === options.length - 1}
              onSelect={() => {
                onChange(opt);
                setOpen(false);
                setFocusedField(null);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EditSpecInput({ fieldKey, category, value, onChange, placeholder }) {
  const wrapRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const suggestions = specSuggestionsMap[category]?.[fieldKey] || [];
  const filtered = value
    ? suggestions.filter(
        (s) =>
          s.toLowerCase().includes(value.toLowerCase()) &&
          s.toLowerCase() !== value.toLowerCase(),
      )
    : suggestions;
  const validator = SPEC_VALIDATORS[category]?.[fieldKey];
  const inlineError = value && validator ? validator(value) : null;
  const showDrop = open && focused && filtered.length > 0 && !inlineError;

  useEffect(() => {
    function handler(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        setFocused(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          setFocused(true);
          setOpen(true);
        }}
        onBlur={() => {
          setFocused(false);
        }}
        style={{
          width: "100%",
          padding: "0.6rem 0.85rem",
          boxSizing: "border-box",
          background: inlineError
            ? "rgba(255,107,107,0.06)"
            : focused
              ? "var(--bg-input-focus)"
              : "var(--bg-input)",
          border: inlineError
            ? "1px solid rgba(255,107,107,0.5)"
            : focused
              ? `1px solid var(--accent-border)`
              : value
                ? "1px solid var(--accent-border)"
                : "1px solid var(--glass-border)",
          borderRadius: showDrop || inlineError ? "10px 10px 0 0" : "10px",
          color: "var(--text-primary)",
          fontSize: "0.83rem",
          outline: "none",
          transition: "background 0.2s, border 0.2s",
          fontFamily: "inherit",
        }}
      />
      {showDrop && (
        <div
          style={{
            ...editDropMenuStyle,
            borderRadius: "0 0 10px 10px",
            maxHeight: "160px",
          }}
        >
          {filtered.map((s, i) => (
            <EditDropItem
              key={s}
              label={s}
              isFirst={i === 0}
              isLast={i === filtered.length - 1}
              onSelect={() => {
                onChange(s);
                setOpen(false);
                setFocused(false);
              }}
            />
          ))}
        </div>
      )}
      {inlineError && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.3rem",
            padding: "0.3rem 0.7rem",
            background: "rgba(255,107,107,0.08)",
            border: "1px solid rgba(255,107,107,0.2)",
            borderTop: "none",
            borderRadius: "0 0 10px 10px",
          }}
        >
          <svg
            width="9"
            height="9"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ff6b6b"
            strokeWidth="3"
            strokeLinecap="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span
            style={{ fontSize: "0.62rem", color: "#ff6b6b", fontWeight: "600" }}
          >
            {inlineError}
          </span>
        </div>
      )}
    </div>
  );
}

const editSubcategoryMap = {
  Clothing: ["XS", "S", "M", "L", "XL", "XXL"],
  "Books & Notes": [
    "1st Sem",
    "2nd Sem",
    "3rd Sem",
    "4th Sem",
    "5th Sem",
    "6th Sem",
    "7th Sem",
    "8th Sem",
  ],
  Electronics: [
    "Laptop",
    "Phone",
    "Tablet",
    "Headphones",
    "Camera",
    "Accessories",
    "Other",
  ],
  Furniture: ["Chair", "Table", "Bed", "Shelf", "Sofa", "Other"],
  "Sports & Fitness": [
    "Cricket",
    "Football",
    "Basketball",
    "Gym Equipment",
    "Badminton",
    "Cycling",
    "Other",
  ],
  Stationery: [
    "Notes",
    "Textbook",
    "Novel",
    "Art Supplies",
    "Geometry Box",
    "Other",
  ],
  Appliances: [
    "Fan",
    "Fridge",
    "Microwave",
    "Washing Machine",
    "AC",
    "Heater",
    "Other",
  ],
  "Games & Hobbies": [
    "Board Game",
    "Video Game",
    "Puzzle",
    "Instrument",
    "Collectible",
    "Other",
  ],
  Services: ["Tutoring", "Repair", "Design", "Photography", "Other"],
  "Food & Drinks": ["Homemade", "Packaged", "Beverages", "Snacks", "Other"],
  Other: [],
};
const editSubcategoryLabelMap = {
  Clothing: "Size",
  "Books & Notes": "Semester",
  Electronics: "Type",
  Furniture: "Type",
  "Sports & Fitness": "Sport",
};

// ── ListingRow ────────────────────────────────────────────────
function ListingRow({
  item,
  onDelete,
  onUpdate,
  isHighlighted,
  selectMode,
  selected,
  onToggle,
  gridSize = 1,
}) {
  const [hovered, setHovered] = useState(false);
  const [editHovered, setEditHovered] = useState(false);
  const [deleteHovered, setDeleteHovered] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [flash, setFlash] = useState(false);
  const rowRef = useRef(null);

  // Scroll into view + animate border when navigated from ItemDetail with ?item=ID
  useEffect(() => {
    if (isHighlighted) {
      setFlash(true);
      const t1 = setTimeout(
        () =>
          rowRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          }),
        150,
      );
      const t2 = setTimeout(() => setFlash(false), 2000);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [isHighlighted]);

  const [editForm, setEditForm] = useState({
    title: item.title,
    price: item.price,
    category: item.category,
    condition: item.condition,
    description: item.description || "",
    status: item.status,
    quantity: item.quantity || 1,
    subcategory: item.subcategory || "",
    purchaseYear: item.purchaseYear ? String(item.purchaseYear) : "",
    expiryDate: item.expiryDate ? item.expiryDate.slice(0, 10) : "",
    madeOn: item.madeOn ? item.madeOn.slice(0, 10) : "",
  });
  const [editSpecs, setEditSpecs] = useState(() => {
    const existing =
      item.specs && typeof item.specs === "object" ? item.specs : {};
    const fields = SPEC_FIELDS[item.category] || [];
    const initial = {};
    fields.forEach((f) => {
      initial[f.key] = existing[f.key] || "";
    });
    return initial;
  });
  const [specErrors, setSpecErrors] = useState({});

  // Image state — seed from item.images (array) or item.imageUrl (single)
  const [editImages, setEditImages] = useState(() => {
    const imgs =
      Array.isArray(item.images) && item.images.length > 0
        ? item.images
        : item.imageUrl
          ? [item.imageUrl]
          : [];
    return imgs.map((url, i) => ({
      _uid: `existing-${i}`,
      url,
      preview: url,
      uploading: false,
    }));
  });
  const [imgError, setImgError] = useState(null);
  const editFileRef = useRef(null);
  const editDragIdx = useRef(null);
  const [editDragOver, setEditDragOver] = useState(false);
  const [editDragOverIdx, setEditDragOverIdx] = useState(null);
  const [editPreviewIdx, setEditPreviewIdx] = useState(null);

  async function handleAddImages(files) {
    setImgError(null);
    const valid = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, 5 - editImages.length);
    if (!valid.length) return;
    const newSlots = valid.map((f) => ({
      _uid: Math.random().toString(36).slice(2),
      name: f.name,
      preview: URL.createObjectURL(f),
      url: null,
      publicId: null,
      uploading: true,
    }));
    setEditImages((prev) => [...prev, ...newSlots]);
    const results = await Promise.allSettled(
      newSlots.map(async (slot, i) => {
        const fd = new FormData();
        fd.append("image", valid[i]);
        const res = await API.post("/upload/item-image", fd);
        setEditImages((prev) =>
          prev.map((img) =>
            img._uid === slot._uid
              ? {
                  ...img,
                  url: res.data.url,
                  publicId: res.data.publicId,
                  uploading: false,
                }
              : img,
          ),
        );
      }),
    );
    const failed = results.filter((r) => r.status === "rejected");
    if (failed.length > 0) {
      setEditImages((prev) => prev.filter((img) => !img.uploading));
      setImgError(`${failed.length} image(s) failed to upload.`);
    }
  }

  function handleRemoveImage(idx) {
    const img = editImages[idx];
    if (img?.publicId)
      API.delete("/upload/item-image", {
        data: { publicId: img.publicId },
      }).catch(() => {});
    setEditImages((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleReorderImages(from, to) {
    setEditImages((prev) => {
      const arr = [...prev];
      const [moved] = arr.splice(from, 1);
      arr.splice(to, 0, moved);
      return arr;
    });
  }

  const status = item.status?.toLowerCase();

  // Title inline errors
  const titleVal = editForm.title;
  const titleStartsSpecial =
    titleVal.length > 0 && /^[^a-zA-Z0-9]/.test(titleVal);
  const titleStartsNum =
    titleVal.length > 0 && !titleStartsSpecial && /^\d/.test(titleVal);
  const titleTooShort =
    titleVal.length > 0 &&
    !titleStartsSpecial &&
    !titleStartsNum &&
    titleVal.trim().length < 10;

  function handleCategoryChange(newCategory) {
    const newFields = SPEC_FIELDS[newCategory] || [];
    const newSpecs = {};
    newFields.forEach((f) => {
      newSpecs[f.key] = "";
    });
    setEditForm((prev) => ({
      ...prev,
      category: newCategory,
      subcategory: "",
    }));
    setEditSpecs(newSpecs);
    setSpecErrors({});
  }

  function handleSpecChange(key, value) {
    setEditSpecs((prev) => ({ ...prev, [key]: value }));
    const validator = SPEC_VALIDATORS[editForm.category]?.[key];
    if (validator && value.trim() !== "") {
      const err = validator(value);
      setSpecErrors((prev) => ({ ...prev, [key]: err || null }));
    } else {
      setSpecErrors((prev) => ({ ...prev, [key]: null }));
    }
  }

  function handleDeleteClick() {
    setShowConfirm(true);
  }

  async function handleConfirmDelete() {
    setShowConfirm(false);
    onDelete(item.id);
    try {
      await API.delete(`/items/${item.id}`);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete item.");
    }
  }

  async function handleSave() {
    // Title validation
    if (!editForm.title.trim()) {
      alert("Title is required.");
      return;
    }
    if (/^[^a-zA-Z0-9]/.test(editForm.title.trim())) {
      alert("Title can't start with a special character.");
      return;
    }
    if (/^\d/.test(editForm.title.trim())) {
      alert("Title can't start with a number.");
      return;
    }
    if (editForm.title.trim().length < 10) {
      alert("Title is too short (min 10 chars).");
      return;
    }
    // Price validation
    const parsedPrice = parseFloat(editForm.price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      alert("Price must be greater than \u20b90.");
      return;
    }
    // Spec validation
    const validators = SPEC_VALIDATORS[editForm.category] || {};
    const newErrors = {};
    let hasSpecError = false;
    Object.entries(editSpecs).forEach(([key, value]) => {
      if (value && String(value).trim() !== "") {
        const err = validators[key]?.(value);
        if (err) {
          newErrors[key] = err;
          hasSpecError = true;
        }
      }
    });
    if (hasSpecError) {
      setSpecErrors(newErrors);
      return;
    }
    const cleanSpecs = Object.fromEntries(
      Object.entries(editSpecs).filter(([, v]) => v && String(v).trim() !== ""),
    );
    try {
      setSaving(true);
      const uploadedUrls = editImages
        .filter((img) => img.url)
        .map((img) => img.url);
      const res = await API.put(`/items/${item.id}`, {
        ...editForm,
        price: parsedPrice,
        quantity: parseInt(editForm.quantity) || 1,
        purchaseYear: editForm.purchaseYear
          ? parseInt(editForm.purchaseYear)
          : null,
        expiryDate: editForm.expiryDate || null,
        madeOn: editForm.madeOn || null,
        specs: Object.keys(cleanSpecs).length > 0 ? cleanSpecs : null,
        images: uploadedUrls,
        imageUrl: uploadedUrls[0] || null,
      });
      onUpdate(res.data);
      setEditing(false);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to update item.");
    } finally {
      setSaving(false);
    }
  }

  const editSubcategories = editSubcategoryMap[editForm.category] || [];
  const editSubcategoryLabel = editSubcategoryLabelMap[editForm.category] || "";
  const currentSpecFields = SPEC_FIELDS[editForm.category] || [];

  return (
    <>
      {showConfirm && (
        <ConfirmDeleteModal
          title={item.title}
          onConfirm={handleConfirmDelete}
          onCancel={() => setShowConfirm(false)}
        />
      )}
      <div
        ref={rowRef}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => {
          if (selectMode) {
            onToggle();
          }
        }}
        style={{
          background: selected
            ? "linear-gradient(135deg, rgba(var(--accent-rgb),0.12) 0%, rgba(var(--accent-rgb),0.04) 100%)"
            : hovered
              ? "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.05) 100%)"
              : "linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)",
          backdropFilter: "blur(20px)",
          border: flash
            ? "1px solid rgba(var(--accent-rgb),0.5)"
            : selected
              ? "1px solid rgba(var(--accent-rgb),0.3)"
              : editing
                ? "1px solid var(--accent-border)"
                : hovered
                  ? "1px solid rgba(255,255,255,0.16)"
                  : "1px solid rgba(255,255,255,0.09)",
          borderRadius: "16px",
          padding: "1.25rem 1.75rem",
          transition: "all 0.3s ease",
          position: "relative",
          overflow: "hidden",
          cursor: selectMode ? "pointer" : "default",
          boxShadow: selected
            ? "0 4px 20px rgba(var(--accent-rgb),0.1)"
            : flash
              ? "0 0 0 2px rgba(var(--accent-rgb),0.12), 0 0 18px rgba(var(--accent-rgb),0.08), 0 8px 30px rgba(0,0,0,0.35)"
              : hovered
                ? "0 8px 30px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)"
                : "0 4px 20px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.05)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "1px",
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)",
            borderRadius: "16px 16px 0 0",
          }}
        />
        {flash && (
          <svg
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none",
              zIndex: 10,
              overflow: "visible",
              borderRadius: "16px",
            }}
          >
            <rect
              x="1"
              y="1"
              width="calc(100% - 2px)"
              height="calc(100% - 2px)"
              rx="15"
              ry="15"
              fill="none"
              stroke="url(#lg1)"
              strokeWidth="1.5"
              strokeDasharray="50 10000"
              strokeLinecap="round"
              style={{ animation: "dashMove 1.2s linear infinite" }}
            />
            <defs>
              <linearGradient
                id="lg1"
                gradientUnits="userSpaceOnUse"
                x1="0"
                y1="0"
                x2="100%"
                y2="0"
              >
                <stop offset="0%" stopColor="var(--accent)" stopOpacity="0" />
                <stop offset="50%" stopColor="var(--accent)" stopOpacity="1" />
                <stop
                  offset="100%"
                  stopColor="var(--accent-alt)"
                  stopOpacity="0"
                />
              </linearGradient>
            </defs>
          </svg>
        )}

        {!editing && (
          <div
            className="listing-row-view"
            style={{
              flexDirection: gridSize === 1 ? "row" : "column",
              alignItems: gridSize === 1 ? "center" : "flex-start",
              gap: gridSize === 1 ? "1.25rem" : "1rem",
            }}
          >
            {/* Checkbox */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                onToggle && onToggle();
              }}
              style={{
                width: "20px",
                height: "20px",
                borderRadius: "6px",
                flexShrink: 0,
                border: selected ? "none" : "1.5px solid var(--border-hover)",
                background: selected
                  ? "linear-gradient(135deg, var(--accent), var(--accent-alt))"
                  : "var(--bg-surface)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s ease",
                boxShadow: selected
                  ? "0 2px 10px rgba(var(--accent-rgb),0.45)"
                  : "none",
                opacity: hovered || selectMode ? 1 : 0,
                transform: hovered || selectMode ? "scale(1)" : "scale(0.7)",
                pointerEvents: hovered || selectMode ? "auto" : "none",
                cursor: "pointer",
              }}
            >
              {selected && (
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <polyline
                    points="2,6 5,9 10,3"
                    stroke="white"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
            {item.images?.[0] && (
              <div
                style={{
                  width: gridSize === 1 ? "50px" : "100%",
                  height: gridSize === 1 ? "50px" : "150px",
                  borderRadius: "12px",
                  overflow: "hidden",
                  flexShrink: 0,
                  border: "1px solid var(--border)",
                  background: "var(--bg-card)",
                }}
              >
                <img
                  src={item.images[0]}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            )}
            <div
              style={{
                minWidth: 0,
                flex: 1,
                width: gridSize === 1 ? "auto" : "100%",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: gridSize === 1 ? "1.05rem" : "1.1rem",
                  fontWeight: "700",
                  color: "var(--text-primary)",
                  letterSpacing: "-0.3px",
                  wordBreak: "break-word",
                  lineHeight: "1.3",
                }}
              >
                {item.title}
              </h3>
              <div className="listing-row-meta">
                <span
                  style={{
                    fontWeight: "800",
                    fontSize: "0.95rem",
                    background:
                      "linear-gradient(135deg, var(--accent), var(--accent-alt))",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  &#x20B9;{Number(item.price).toLocaleString("en-IN")}
                </span>
                <span
                  style={{
                    width: "3px",
                    height: "3px",
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.15)",
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    color: "var(--text-muted)",
                    fontSize: "0.75rem",
                    fontWeight: "600",
                  }}
                >
                  {item.category}
                </span>
                <span
                  style={{
                    width: "3px",
                    height: "3px",
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.15)",
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: "700",
                    color: status === "pending" ? "#ffd43b" : "#51cf66",
                    background:
                      status === "pending"
                        ? "rgba(255,212,59,0.1)"
                        : "rgba(81,207,102,0.1)",
                    padding: "2px 10px",
                    borderRadius: "20px",
                    border:
                      status === "pending"
                        ? "1px solid rgba(255,212,59,0.15)"
                        : "1px solid rgba(81,207,102,0.15)",
                    textTransform: "capitalize",
                    whiteSpace: "nowrap",
                  }}
                >
                  {status}
                </span>
                <span
                  style={{
                    width: "3px",
                    height: "3px",
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.15)",
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{ color: "var(--text-ghost)", fontSize: "0.7rem" }}
                >
                  Listed {formatDate(item.createdAt)} &middot;{" "}
                  {formatTime(item.createdAt)}
                </span>
              </div>
            </div>
            <div
              className="listing-row-btns"
              style={{
                width: gridSize === 1 ? "auto" : "100%",
                justifyContent: gridSize === 1 ? "flex-end" : "space-between",
                marginTop: gridSize === 1 ? "0" : "0.5rem",
              }}
            >
              {!selectMode && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditing(true);
                  }}
                  onMouseEnter={() => setEditHovered(true)}
                  onMouseLeave={() => setEditHovered(false)}
                  style={{
                    padding: "0.4rem 1rem",
                    background: editHovered
                      ? "var(--bg-card-hover)"
                      : "var(--bg-card)",
                    color: editHovered
                      ? "var(--text-primary)"
                      : "var(--text-secondary)",
                    border: editHovered
                      ? "1px solid var(--border-hover)"
                      : "1px solid var(--border)",
                    borderRadius: "10px",
                    cursor: "pointer",
                    fontSize: "0.8rem",
                    fontWeight: "600",
                    transition: "all 0.2s ease",
                  }}
                >
                  Edit
                </button>
              )}
              {!selectMode && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteClick();
                  }}
                  onMouseEnter={() => setDeleteHovered(true)}
                  onMouseLeave={() => setDeleteHovered(false)}
                  style={{
                    padding: "0.4rem 1rem",
                    background: deleteHovered
                      ? "rgba(255,107,107,0.2)"
                      : "rgba(255,107,107,0.08)",
                    color: deleteHovered ? "#ff6b6b" : "rgba(255,107,107,0.6)",
                    border: deleteHovered
                      ? "1px solid rgba(255,107,107,0.25)"
                      : "1px solid rgba(255,107,107,0.1)",
                    borderRadius: "10px",
                    cursor: "pointer",
                    fontSize: "0.8rem",
                    fontWeight: "600",
                    transition: "all 0.2s ease",
                  }}
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        )}

        {editing && (
          <div style={{ position: "relative", zIndex: 1 }}>
            <div
              style={{
                fontSize: "0.65rem",
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                color: "var(--accent)",
                opacity: 0.7,
                fontWeight: "700",
                marginBottom: "1rem",
              }}
            >
              Editing:{" "}
              <span style={{ color: "var(--text-primary)", opacity: 1 }}>
                {item.title}
              </span>
            </div>

            {/* ── Photos ── */}
            <div style={{ marginBottom: "0.85rem" }}>
              <div
                style={{
                  fontSize: "0.6rem",
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                  fontWeight: "700",
                  marginBottom: "0.5rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                Photos
                {editImages.length === 0 && (
                  <span
                    style={{
                      color: "var(--text-ghost)",
                      fontWeight: "500",
                      textTransform: "none",
                      letterSpacing: 0,
                      fontSize: "0.6rem",
                    }}
                  >
                    optional — add to update
                  </span>
                )}
                {editImages.length >= 1 && (
                  <span
                    style={{
                      color: "var(--accent)",
                      fontWeight: "600",
                      opacity: 0.7,
                      textTransform: "none",
                      letterSpacing: 0,
                      fontSize: "0.6rem",
                    }}
                  >
                    ({editImages.length}/5) · drag to reorder
                  </span>
                )}
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(5, 1fr)",
                  gap: "0.5rem",
                  maxWidth: "420px",
                }}
              >
                {editImages.map((img, i) => (
                  <div
                    key={img._uid || img.url}
                    draggable
                    onDragStart={() => {
                      editDragIdx.current = i;
                    }}
                    onDragEnter={() => setEditDragOverIdx(i)}
                    onDragEnd={() => {
                      if (
                        editDragIdx.current !== null &&
                        editDragOverIdx !== null &&
                        editDragIdx.current !== editDragOverIdx
                      )
                        handleReorderImages(
                          editDragIdx.current,
                          editDragOverIdx,
                        );
                      editDragIdx.current = null;
                      setEditDragOverIdx(null);
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => {
                      if (!img.uploading) setEditPreviewIdx(i);
                    }}
                    style={{
                      position: "relative",
                      aspectRatio: "1",
                      borderRadius: "10px",
                      overflow: "hidden",
                      border:
                        editDragOverIdx === i
                          ? "2px solid rgba(232,119,34,0.8)"
                          : i === 0
                            ? "2px solid rgba(232,119,34,0.4)"
                            : "2px solid rgba(255,255,255,0.06)",
                      cursor: img.uploading ? "wait" : "pointer",
                      transition: "border 0.15s, transform 0.15s",
                      transform:
                        editDragOverIdx === i ? "scale(1.04)" : "scale(1)",
                      opacity: img.uploading ? 0.6 : 1,
                    }}
                  >
                    <img
                      src={img.preview || img.url}
                      alt=""
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                        pointerEvents: "none",
                      }}
                    />
                    {i === 0 && (
                      <div
                        style={{
                          position: "absolute",
                          bottom: "5px",
                          left: "5px",
                          background: "rgba(232,119,34,0.9)",
                          borderRadius: "5px",
                          fontSize: "0.52rem",
                          fontWeight: "800",
                          letterSpacing: "0.5px",
                          textTransform: "uppercase",
                          color: "white",
                          padding: "2px 6px",
                        }}
                      >
                        Cover
                      </div>
                    )}
                    {img.uploading && (
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "rgba(0,0,0,0.45)",
                        }}
                      >
                        <div
                          style={{
                            width: "18px",
                            height: "18px",
                            border: "2.5px solid rgba(255,255,255,0.2)",
                            borderTopColor: "var(--accent)",
                            borderRadius: "50%",
                            animation: "dashSpin 0.7s linear infinite",
                          }}
                        />
                      </div>
                    )}
                    {!img.uploading && (
                      <button
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          handleRemoveImage(i);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          position: "absolute",
                          top: "5px",
                          right: "5px",
                          width: "22px",
                          height: "22px",
                          borderRadius: "50%",
                          background: "rgba(0,0,0,0.75)",
                          border: "1px solid var(--border-hover)",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          zIndex: 2,
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background =
                            "rgba(239,68,68,0.85)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background =
                            "rgba(0,0,0,0.75)")
                        }
                      >
                        <svg
                          width="9"
                          height="9"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="white"
                          strokeWidth="3"
                          strokeLinecap="round"
                        >
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
                {editImages.length < 5 && (
                  <div
                    onClick={() => {
                      setImgError(null);
                      editFileRef.current?.click();
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setEditDragOver(true);
                    }}
                    onDragLeave={() => setEditDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setEditDragOver(false);
                      handleAddImages(e.dataTransfer.files);
                    }}
                    style={{
                      aspectRatio: "1",
                      borderRadius: "10px",
                      cursor: "pointer",
                      border: editDragOver
                        ? "2px dashed var(--border-dashed-hover)"
                        : "2px dashed var(--border-dashed)",
                      background: editDragOver
                        ? "var(--accent-soft)"
                        : "transparent",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.35rem",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor =
                        "var(--border-dashed-hover)";
                      e.currentTarget.style.background = "var(--accent-soft)";
                    }}
                    onMouseLeave={(e) => {
                      if (!editDragOver) {
                        e.currentTarget.style.borderColor =
                          "var(--border-dashed)";
                        e.currentTarget.style.background = "transparent";
                      }
                    }}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="rgba(255,255,255,0.3)"
                      strokeWidth="2"
                      strokeLinecap="round"
                    >
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    <span
                      style={{
                        fontSize: "0.58rem",
                        color: "var(--text-ghost)",
                        fontWeight: "600",
                        textAlign: "center",
                      }}
                    >
                      {editImages.length === 0 ? "Add photo" : "Add more"}
                    </span>
                  </div>
                )}
                {Array.from({
                  length: Math.max(0, 5 - editImages.length - 1),
                }).map((_, i) => (
                  <div
                    key={`ep-${i}`}
                    style={{
                      aspectRatio: "1",
                      borderRadius: "10px",
                      border: "1px solid var(--border)",
                      background: "rgba(255,255,255,0.01)",
                    }}
                  />
                ))}
              </div>
              <input
                ref={editFileRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: "none" }}
                onChange={(e) => {
                  handleAddImages(e.target.files);
                  e.target.value = "";
                }}
              />
              {imgError && (
                <div
                  style={{
                    marginTop: "0.4rem",
                    fontSize: "0.7rem",
                    color: "#ff6b6b",
                  }}
                >
                  {imgError}
                </div>
              )}
            </div>

            {/* ── Image preview lightbox ── */}
            {editPreviewIdx !== null && editImages[editPreviewIdx] && (
              <div
                onClick={() => setEditPreviewIdx(null)}
                style={{
                  position: "fixed",
                  inset: 0,
                  zIndex: 999999,
                  background: "rgba(0,0,0,0.88)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "zoom-out",
                }}
              >
                <img
                  src={
                    editImages[editPreviewIdx].url ||
                    editImages[editPreviewIdx].preview
                  }
                  alt=""
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    maxWidth: "85vw",
                    maxHeight: "85vh",
                    objectFit: "contain",
                    borderRadius: "14px",
                    boxShadow: "0 40px 100px rgba(0,0,0,0.7)",
                    cursor: "default",
                  }}
                />
                <button
                  onClick={() => setEditPreviewIdx(null)}
                  style={{
                    position: "fixed",
                    top: "1.25rem",
                    right: "1.25rem",
                    width: "38px",
                    height: "38px",
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.1)",
                    border: "1px solid var(--border-hover)",
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  ✕
                </button>
              </div>
            )}

            {/* ── Title ── */}
            <div style={{ marginBottom: "0.75rem", gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Title</label>
              <input
                value={editForm.title}
                onChange={(e) =>
                  setEditForm({ ...editForm, title: e.target.value })
                }
                onFocus={() => setFocusedField("title")}
                onBlur={() => setFocusedField(null)}
                placeholder="e.g. Physics Textbook by H.C. Verma"
                style={{
                  ...inputStyle,
                  borderColor:
                    focusedField === "title"
                      ? "var(--accent-border)"
                      : titleStartsSpecial || titleStartsNum || titleTooShort
                        ? "rgba(255,107,107,0.5)"
                        : "rgba(255,255,255,0.08)",
                  borderRadius:
                    titleStartsSpecial || titleStartsNum || titleTooShort
                      ? "10px 10px 0 0"
                      : "10px",
                }}
              />
              {titleStartsSpecial && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    padding: "0.3rem 0.7rem",
                    background: "rgba(255,107,107,0.08)",
                    border: "1px solid rgba(255,107,107,0.2)",
                    borderTop: "none",
                    borderRadius: "0 0 10px 10px",
                  }}
                >
                  <svg
                    width="9"
                    height="9"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#ff6b6b"
                    strokeWidth="3"
                    strokeLinecap="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span
                    style={{
                      fontSize: "0.62rem",
                      color: "#ff6b6b",
                      fontWeight: "600",
                    }}
                  >
                    Can&apos;t start with a special character
                  </span>
                </div>
              )}
              {titleStartsNum && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    padding: "0.3rem 0.7rem",
                    background: "rgba(255,107,107,0.08)",
                    border: "1px solid rgba(255,107,107,0.2)",
                    borderTop: "none",
                    borderRadius: "0 0 10px 10px",
                  }}
                >
                  <svg
                    width="9"
                    height="9"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#ff6b6b"
                    strokeWidth="3"
                    strokeLinecap="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span
                    style={{
                      fontSize: "0.62rem",
                      color: "#ff6b6b",
                      fontWeight: "600",
                    }}
                  >
                    Can&apos;t start with a number
                  </span>
                </div>
              )}
              {titleTooShort && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    padding: "0.3rem 0.7rem",
                    background: "rgba(255,107,107,0.08)",
                    border: "1px solid rgba(255,107,107,0.2)",
                    borderTop: "none",
                    borderRadius: "0 0 10px 10px",
                  }}
                >
                  <svg
                    width="9"
                    height="9"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#ff6b6b"
                    strokeWidth="3"
                    strokeLinecap="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span
                    style={{
                      fontSize: "0.62rem",
                      color: "#ff6b6b",
                      fontWeight: "600",
                    }}
                  >
                    Too short (min 10 chars)
                  </span>
                </div>
              )}
            </div>

            <div className="edit-grid" style={{ marginBottom: "0.75rem" }}>
              {/* ── Price ── */}
              <div>
                <label style={labelStyle}>Price (&#x20B9;)</label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={editForm.price}
                  onChange={(e) =>
                    setEditForm({ ...editForm, price: e.target.value })
                  }
                  onFocus={() => setFocusedField("price")}
                  onBlur={() => setFocusedField(null)}
                  onKeyDown={(e) =>
                    ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()
                  }
                  placeholder="e.g. 299"
                  style={{
                    ...inputStyle,
                    borderColor:
                      focusedField === "price"
                        ? "var(--accent-border)"
                        : "rgba(255,255,255,0.08)",
                  }}
                />
              </div>

              {/* ── Category ── */}
              <div>
                <label style={labelStyle}>Category</label>
                <EditCustomSelect
                  value={editForm.category}
                  onChange={handleCategoryChange}
                  options={categories}
                  placeholder="Select category"
                  focusKey="category"
                  focusedField={focusedField}
                  setFocusedField={setFocusedField}
                />
              </div>

              {/* ── Condition ── */}
              <div>
                <label style={labelStyle}>Condition</label>
                <EditCustomSelect
                  value={editForm.condition}
                  onChange={(val) =>
                    setEditForm({ ...editForm, condition: val })
                  }
                  options={conditions}
                  placeholder="Select condition"
                  focusKey="condition"
                  focusedField={focusedField}
                  setFocusedField={setFocusedField}
                />
              </div>

              {/* ── Status ── */}
              <div>
                <label style={labelStyle}>Status</label>
                <EditCustomSelect
                  value={editForm.status}
                  onChange={(val) => setEditForm({ ...editForm, status: val })}
                  options={statuses}
                  placeholder="Select status"
                  focusKey="status"
                  focusedField={focusedField}
                  setFocusedField={setFocusedField}
                />
              </div>

              {/* ── Quantity ── */}
              <div>
                <label style={labelStyle}>Quantity</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={editForm.quantity}
                  onChange={(e) =>
                    setEditForm({ ...editForm, quantity: e.target.value })
                  }
                  onFocus={() => setFocusedField("quantity")}
                  onBlur={() => setFocusedField(null)}
                  onKeyDown={(e) =>
                    ["e", "E", "+", "-", "."].includes(e.key) &&
                    e.preventDefault()
                  }
                  placeholder="1"
                  style={{
                    ...inputStyle,
                    borderColor:
                      focusedField === "quantity"
                        ? "var(--accent-border)"
                        : "rgba(255,255,255,0.08)",
                  }}
                />
              </div>

              {/* ── Subcategory ── */}
              {editSubcategories.length > 0 && (
                <div>
                  <label style={labelStyle}>
                    {editSubcategoryLabel || "Subcategory"}
                  </label>
                  <EditCustomSelect
                    value={editForm.subcategory}
                    onChange={(val) =>
                      setEditForm({ ...editForm, subcategory: val })
                    }
                    options={editSubcategories}
                    placeholder="Select..."
                    focusKey="subcategory"
                    focusedField={focusedField}
                    setFocusedField={setFocusedField}
                  />
                </div>
              )}

              {/* ── Purchase Year ── */}
              {["Electronics", "Appliances", "Games & Hobbies"].includes(
                editForm.category,
              ) && (
                <div>
                  <label style={labelStyle}>Purchase Year</label>
                  <EditCustomSelect
                    value={editForm.purchaseYear}
                    onChange={(val) =>
                      setEditForm({ ...editForm, purchaseYear: val })
                    }
                    options={Array.from({ length: 11 }, (_, i) =>
                      String(new Date().getFullYear() - i),
                    )}
                    placeholder="Select year..."
                    focusKey="purchaseYear"
                    focusedField={focusedField}
                    setFocusedField={setFocusedField}
                  />
                </div>
              )}

              {/* ── Expiry / Made On ── */}
              {editForm.category === "Food & Drinks" && (
                <div>
                  <label style={labelStyle}>
                    {editForm.subcategory === "Homemade"
                      ? "Made On"
                      : "Expiry Date"}
                  </label>
                  <input
                    type="date"
                    value={
                      editForm.subcategory === "Homemade"
                        ? editForm.madeOn
                        : editForm.expiryDate
                    }
                    onChange={(e) =>
                      setEditForm(
                        editForm.subcategory === "Homemade"
                          ? { ...editForm, madeOn: e.target.value }
                          : { ...editForm, expiryDate: e.target.value },
                      )
                    }
                    style={{
                      ...inputStyle,
                      borderColor: "rgba(255,255,255,0.08)",
                      colorScheme: "dark",
                    }}
                  />
                </div>
              )}

              {/* ── Description ── */}
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                  onFocus={() => setFocusedField("description")}
                  onBlur={() => setFocusedField(null)}
                  rows={3}
                  placeholder="Condition, age, any defects, reason for selling..."
                  style={{
                    ...inputStyle,
                    resize: "vertical",
                    fontFamily: "inherit",
                    borderColor:
                      focusedField === "description"
                        ? "var(--accent-border)"
                        : "rgba(255,255,255,0.08)",
                  }}
                />
              </div>
            </div>

            {/* ── Specifications ── */}
            {currentSpecFields.length > 0 && (
              <div
                style={{
                  marginBottom: "0.75rem",
                  background: "var(--accent-soft)",
                  border: "1px solid var(--accent-border)",
                  borderRadius: "12px",
                  padding: "1rem 1.15rem",
                  position: "relative",
                  zIndex: 10,
                  overflow: "visible",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    marginBottom: "0.75rem",
                  }}
                >
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  >
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" />
                  </svg>
                  <span
                    style={{
                      fontSize: "0.58rem",
                      letterSpacing: "1.5px",
                      textTransform: "uppercase",
                      color: "var(--accent)",
                      opacity: 0.8,
                      fontWeight: "800",
                    }}
                  >
                    {editForm.category} Specifications
                  </span>
                  <span
                    style={{
                      fontSize: "0.55rem",
                      color: "var(--text-ghost)",
                      fontWeight: "500",
                      marginLeft: "auto",
                    }}
                  >
                    type or pick a suggestion
                  </span>
                </div>
                <div className="edit-grid">
                  {currentSpecFields.map((field) => (
                    <div key={field.key} style={{ overflow: "visible" }}>
                      <label style={{ ...labelStyle, marginBottom: "0.3rem" }}>
                        {field.label}
                      </label>
                      <EditSpecInput
                        fieldKey={field.key}
                        category={editForm.category}
                        value={editSpecs[field.key] || ""}
                        onChange={(val) => handleSpecChange(field.key, val)}
                        placeholder={
                          specFieldsMap[editForm.category]?.find(
                            (f) => f.key === field.key,
                          )?.placeholder || ""
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div
              style={{
                display: "flex",
                gap: "0.5rem",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => {
                  setEditing(false);
                  setSpecErrors({});
                }}
                style={{
                  padding: "0.4rem 1rem",
                  borderRadius: "10px",
                  cursor: "pointer",
                  background: "var(--bg-card)",
                  color: "var(--text-muted)",
                  border: "1px solid var(--border)",
                  fontSize: "0.8rem",
                  fontWeight: "600",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: "0.4rem 1.25rem",
                  borderRadius: "10px",
                  cursor: saving ? "not-allowed" : "pointer",
                  background: saving
                    ? "rgba(255,255,255,0.06)"
                    : "linear-gradient(135deg, var(--accent), var(--accent-alt))",
                  color: saving ? "rgba(255,255,255,0.3)" : "white",
                  border: "none",
                  fontSize: "0.8rem",
                  fontWeight: "700",
                  boxShadow: saving ? "none" : "var(--shadow-accent)",
                }}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

const labelStyle = {
  display: "block",
  fontSize: "0.6rem",
  letterSpacing: "1.5px",
  textTransform: "uppercase",
  color: "var(--text-muted)",
  fontWeight: "700",
  marginBottom: "0.35rem",
};
const inputStyle = {
  width: "100%",
  padding: "0.55rem 0.85rem",
  boxSizing: "border-box",
  background: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: "10px",
  color: "var(--text-primary)",
  fontSize: "0.85rem",
  outline: "none",
  fontFamily: "inherit",
};

// ── Dashboard ─────────────────────────────────────────────────
function Dashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // ── Draggable back button ──────────────────────────────────
  const [draggable, setDraggable] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("floatingDraggable") ?? "false");
    } catch {
      return false;
    }
  });
  useEffect(() => {
    const sync = () => {
      try {
        setDraggable(
          JSON.parse(localStorage.getItem("floatingDraggable") ?? "false"),
        );
      } catch {}
    };
    window.addEventListener("floatingDraggableChanged", sync);
    return () => window.removeEventListener("floatingDraggableChanged", sync);
  }, []);
  const backRef = useRef(null);
  // Restore saved drag position on mount
  useEffect(() => {
    if (!draggable || !backRef.current) return;
    try {
      const saved = JSON.parse(localStorage.getItem("drag_backbtn_dashboard"));
      if (saved)
        backRef.current.style.transform = `translate(${saved.dx}px, ${saved.dy}px)`;
    } catch {}
  }, []); // eslint-disable-line
  // Reset inline styles when draggable toggles
  useEffect(() => {
    const el = backRef.current;
    if (!el) return;
    if (!draggable) {
      el.style.transform = "";
      el.style.transition = "";
      el.style.zIndex = "";
      el.style.cursor = "";
      localStorage.removeItem("drag_backbtn_dashboard");
    } else {
      try {
        const saved = JSON.parse(
          localStorage.getItem("drag_backbtn_dashboard"),
        );
        if (saved)
          el.style.transform = `translate(${saved.dx}px, ${saved.dy}px)`;
      } catch {}
    }
  }, [draggable]);
  const startBackDrag = useCallback(
    (clientX, clientY) => {
      if (!draggable || !backRef.current) return;
      const el = backRef.current;
      // Read current transform as base so accumulated drags don't stack
      const match = el.style.transform.match(
        /translate\(([-.0-9]+)px,\s*([-.0-9]+)px\)/,
      );
      const baseDx = match ? parseFloat(match[1]) : 0;
      const baseDy = match ? parseFloat(match[2]) : 0;
      let dx = baseDx,
        dy = baseDy;
      let hasDragged = false;
      let rafId = null;

      el.style.transition = "none";
      el.style.zIndex = "9999";
      el.style.cursor = "grabbing";

      const onMove = (cx, cy) => {
        dx = baseDx + (cx - clientX);
        dy = baseDy + (cy - clientY);
        if (Math.abs(cx - clientX) > 4 || Math.abs(cy - clientY) > 4)
          hasDragged = true;
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          el.style.transform = `translate(${dx}px, ${dy}px)`;
        });
      };
      const onUp = () => {
        if (rafId) cancelAnimationFrame(rafId);
        el.style.cursor = "grab";
        el.style.transition = "";
        el.style.zIndex = "";
        // Save transform so position restores on refresh
        if (hasDragged) {
          localStorage.setItem(
            "drag_backbtn_dashboard",
            JSON.stringify({ dx, dy }),
          );
          const kill = (ce) => {
            ce.stopPropagation();
            ce.preventDefault();
            window.removeEventListener("click", kill, true);
          };
          window.addEventListener("click", kill, true);
        }
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onUp);
        window.removeEventListener("touchmove", onTouchMove);
        window.removeEventListener("touchend", onUp);
      };
      const onMouseMove = (e) => onMove(e.clientX, e.clientY);
      const onTouchMove = (e) => {
        e.preventDefault();
        onMove(e.touches[0].clientX, e.touches[0].clientY);
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onUp);
      window.addEventListener("touchmove", onTouchMove, { passive: false });
      window.addEventListener("touchend", onUp);
    },
    [draggable],
  );

  const onBackMouseDown = useCallback(
    (e) => {
      e.preventDefault();
      startBackDrag(e.clientX, e.clientY);
    },
    [startBackDrag],
  );

  const onBackTouchStart = useCallback(
    (e) => {
      startBackDrag(e.touches[0].clientX, e.touches[0].clientY);
    },
    [startBackDrag],
  );

  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [postBtnHovered, setPostBtnHovered] = useState(false);
  const [freshSaleItemIds, setFreshSaleItemIds] = useState(new Set());

  const tabParam = searchParams.get("tab");
  const highlightItemId = searchParams.get("item")
    ? parseInt(searchParams.get("item"))
    : null;

  // Grid Size state
  const [gridSize, setGridSizeState] = useState(() => {
    try {
      return parseInt(localStorage.getItem("gridSize_dashboard") || "1", 10);
    } catch {
      return 1;
    }
  });

  useEffect(() => {
    window.__homeGridBridge = {
      set: (val) => setGridSizeState(val),
    };
    function onGridSize(e) {
      setGridSizeState(e.detail.val);
    }
    window.addEventListener("home-grid-size", onGridSize);
    return () => {
      window.removeEventListener("home-grid-size", onGridSize);
      window.__homeGridBridge = null;
    };
  }, []);
  const [activeFilter, setActiveFilter] = useState(tabParam || "active");

  useEffect(() => {
    if (tabParam) setActiveFilter(tabParam);
  }, [tabParam]);

  // When arriving from notification (?tab=sold&item=ID)
  useEffect(() => {
    if (!highlightItemId) return;
    if (tabParam === "sold") {
      setActiveFilter("sold");
      setTimeout(
        () =>
          setSearchParams((p) => {
            p.delete("item");
            return p;
          }),
        2200,
      );
      return;
    }
    if (items.length === 0) return;
    const target = items.find((i) => i.id === highlightItemId);
    if (!target) return;
    const s = target.status?.toLowerCase();
    if (s === "available") setActiveFilter("active");
    else if (s === "pending") setActiveFilter("pending");
    else setActiveFilter("sold");
    setTimeout(
      () =>
        setSearchParams((p) => {
          p.delete("item");
          return p;
        }),
      2200,
    );
  }, [highlightItemId, items, tabParam]);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const username = user.firstName || "there";

  const fetchData = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      const [itemsRes, txnRes] = await Promise.all([
        API.get("/items/mine"),
        API.get("/transactions"),
      ]);
      setItems(itemsRes.data);
      setTransactions(txnRes.data);
      try {
        const notifRes = await API.get("/notifications");
        const unseenNotifs = notifRes.data;
        if (unseenNotifs.length > 0) {
          await API.post("/notifications/mark-seen");
          const itemIds = new Set(
            unseenNotifs.map((n) => Number(n.itemId)).filter(Boolean),
          );
          setFreshSaleItemIds(itemIds);
          setActiveFilter("sold");
        }
      } catch (_) {}
    } catch (err) {
      if (!silent) setError("Failed to load your dashboard.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handler = () => {
      fetchData({ silent: true });
      setActiveFilter("sold");
    };
    socket.on("new-sale", handler);
    return () => socket.off("new-sale", handler);
  }, [fetchData]);

  const [hiddenGroupKeys, setHiddenGroupKeys] = useState(new Set());
  function handleDelete(id, stableKey) {
    if (id != null) setItems((prev) => prev.filter((i) => i.id !== id));
    if (stableKey) setHiddenGroupKeys((prev) => new Set([...prev, stableKey]));
  }
  function handleUpdate(updatedItem) {
    setItems((prev) =>
      prev.map((i) => (i.id === updatedItem.id ? updatedItem : i)),
    );
  }
  function handleTabChange(key) {
    setActiveFilter(key);
    setSearchParams({});
    setSelectMode(false);
    setSelected(new Set());
  }

  // ── Bulk selection state ───────────────────────────────────
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [bulkConfirm, setBulkConfirm] = useState(null); // { action, ids }

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") {
        setSelectMode(false);
        setSelected(new Set());
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function toggleSelect(id) {
    if (!selectMode) setSelectMode(true);
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      if (next.size === 0) setSelectMode(false);
      return next;
    });
  }

  async function executeBulkAction(action, ids) {
    setBulkConfirm(null);
    if (action === "delete") {
      for (const id of ids) {
        try {
          await API.delete(`/items/${id}`);
          setItems((prev) => prev.filter((i) => i.id !== id));
          // Also hide sold group if it had this item
          const grp = visibleSoldGroups.find((g) => g.groupKey === id);
          if (grp)
            setHiddenGroupKeys((prev) => new Set([...prev, grp.stableKey]));
        } catch {}
      }
    } else if (action === "pending") {
      // Only convert available → pending; skip sold and already-pending
      for (const id of ids) {
        const item = items.find((i) => i.id === id);
        if (
          !item ||
          item.status?.toLowerCase() === "pending" ||
          item.status?.toLowerCase() === "sold"
        )
          continue;
        try {
          await API.patch(`/items/${id}/status`, { status: "pending" });
          setItems((prev) =>
            prev.map((i) => (i.id === id ? { ...i, status: "pending" } : i)),
          );
        } catch {}
      }
    } else if (action === "active") {
      // Only convert pending → available; skip sold and already-active
      for (const id of ids) {
        const item = items.find((i) => i.id === id);
        if (
          !item ||
          item.status?.toLowerCase() === "available" ||
          item.status?.toLowerCase() === "sold"
        )
          continue;
        try {
          await API.patch(`/items/${id}/status`, { status: "available" });
          setItems((prev) =>
            prev.map((i) => (i.id === id ? { ...i, status: "available" } : i)),
          );
        } catch {}
      }
    }
    setSelectMode(false);
    setSelected(new Set());
  }

  const activeCount = items.filter(
    (i) => i.status?.toLowerCase() === "available",
  ).length;
  const pendingCount = items.filter(
    (i) => i.status?.toLowerCase() === "pending",
  ).length;
  const soldCount = items.filter(
    (i) => i.status?.toLowerCase() === "sold",
  ).length;

  const myId = user.id;
  const soldTxns = transactions.filter((t) => {
    const txnStatus = (t.status || "").toLowerCase();
    const paymentStatus = (t.payment_status || "").toLowerCase();
    return (
      t.seller_id === myId &&
      txnStatus === "completed" &&
      paymentStatus === "completed"
    );
  });

  const soldGroups = (() => {
    const map = new Map();
    soldTxns.forEach((t) => {
      const key = t.item_id != null ? `item_${t.item_id}` : `txn_${t.id}`;
      if (!map.has(key)) map.set(key, { sales: [], itemId: t.item_id });
      map.get(key).sales.push(t);
    });
    return Array.from(map.entries())
      .map(([key, data]) => {
        const foundItem =
          data.itemId != null ? items.find((i) => i.id === data.itemId) : null;
        return {
          groupKey: data.itemId,
          stableKey: key,
          item: foundItem || null,
          sales: data.sales.sort(
            (a, b) =>
              new Date(getTimestamp(b) || 0) - new Date(getTimestamp(a) || 0),
          ),
        };
      })
      .sort(
        (a, b) =>
          new Date(getTimestamp(b.sales[0]) || 0) -
          new Date(getTimestamp(a.sales[0]) || 0),
      );
  })();

  const visibleSoldGroups = soldGroups.filter(
    (g) =>
      g.groupKey != null &&
      !hiddenGroupKeys.has(g.stableKey) &&
      ((g.item && g.item.status?.toLowerCase() === "sold") || !g.item),
  );
  const activeItems = items.filter(
    (i) => i.status?.toLowerCase() === "available",
  );
  const pendingItems = items.filter(
    (i) => i.status?.toLowerCase() === "pending",
  );
  const allNonSoldItems = items.filter(
    (i) => i.status?.toLowerCase() !== "sold",
  );

  const sectionLabel = {
    active: "Active Listings",
    pending: "Pending Listings",
    sold: "Sold Items",
    all: "All Listings",
  };

  const EmptyState = ({ label }) => (
    <div
      style={{
        textAlign: "center",
        padding: "4rem 2rem",
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
        borderRadius: "20px",
        border: "1px solid var(--border)",
      }}
    >
      <div style={{ fontSize: "2.5rem", marginBottom: "1rem", opacity: 0.4 }}>
        📭
      </div>
      <p style={{ color: "var(--text-ghost)", fontWeight: "500" }}>
        No {label} yet.
      </p>
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes gridSwitchScale {
          0% { opacity: 0; transform: scale(0.98) translateY(10px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
      <div style={{ minHeight: "calc(100vh - 70px)" }}>
        {/* ── Responsive styles injected here ── */}
        <style>{`
        /* ── Dashboard page wrapper ── */
        .dash-wrapper {
          padding: 5rem 4rem 3rem;
          max-width: 960px;
          margin: 0 auto;
        }

        /* ── Back button positioning ── */
        .dash-back-btn {
          position: absolute;
          left: -50px;
          top: 6px;
        }

        /* ── Page heading ── */
        .dash-heading {
          font-size: 3rem;
        }

        /* ── Stats row ── */
        .dash-stats-row {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 2rem;
          align-items: center;
          flex-wrap: nowrap;
        }

        /* ── Filter tabs ── */
        .dash-filter-tabs {
          display: flex;
          gap: 0.6rem;
          margin-bottom: 1.5rem;
          flex-wrap: nowrap;
        }

        /* ── Edit form grid (2 cols by default) ── */
        .edit-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }

        /* ── ListingRow view mode ── */
        .listing-row-view {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
        }
        .listing-row-meta {
          display: flex;
          gap: 0.75rem;
          margin-top: 0.5rem;
          align-items: center;
          flex-wrap: nowrap;
        }
        .listing-row-btns {
          display: flex;
          gap: 0.5rem;
          flex-shrink: 0;
        }

        /* ── SoldGroupRow ── */
        .sold-row-inner {
          padding: 1.25rem 1.75rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
        }
        .sold-row-meta {
          display: flex;
          gap: 0.75rem;
          align-items: center;
          flex-wrap: nowrap;
        }
        .sold-row-actions {
          display: flex;
          gap: 0.5rem;
          align-items: center;
          flex-shrink: 0;
        }

        /* ── Sale history row ── */
        .sale-history-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.65rem 1rem;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 10px;
        }

        /* ════════════════════════════════════
           769px – 1024px  (tablet)
        ════════════════════════════════════ */
        @media (max-width: 1024px) {
          .dash-wrapper {
            padding: 4rem 2.5rem 3rem;
          }
          .dash-back-btn {
            left: -36px;
          }
          .dash-heading {
            font-size: 2.4rem;
          }
        }

        /* ════════════════════════════════════
           < 768px  (mobile)
        ════════════════════════════════════ */
        @media (max-width: 768px) {
          .dash-wrapper {
            padding: 3rem 1.25rem 2.5rem;
          }

          /* Back button goes inline — sits above title, no absolute positioning */
          .dash-back-btn {
            position: static;
            margin-bottom: 0.75rem;
            display: inline-flex !important;
          }

          .dash-heading {
            font-size: 2rem;
          }

          /* Stats row wraps */
          .dash-stats-row {
            flex-wrap: wrap;
          }

          /* Filter tabs wrap */
          .dash-filter-tabs {
            flex-wrap: wrap;
          }

          /* Edit form → 1 col */
          .edit-grid {
            grid-template-columns: 1fr;
          }
          /* Title field was spanning 2 cols — reset on 1-col grid */
          .edit-grid > div[style*="gridColumn"] {
            grid-column: 1 / -1;
          }

          /* ListingRow: stack content + buttons vertically */
          .listing-row-view {
            flex-direction: column;
            align-items: flex-start;
          }
          .listing-row-meta {
            flex-wrap: wrap;
          }
          .listing-row-btns {
            align-self: flex-end;
          }

          /* Date wraps to next line on mobile — no longer hidden */
          .listing-row-meta { row-gap: 0.3rem; }

          /* SoldGroupRow: stack too */
          .sold-row-inner {
            flex-direction: column;
            align-items: flex-start;
            padding: 1rem 1.25rem;
          }
          .sold-row-meta {
            flex-wrap: wrap;
          }
          /* sold-row-date wraps to next line instead of hiding */
          .sold-row-meta { row-gap: 0.3rem; }
          .sold-row-date { font-size: 0.68rem; }
          .sold-row-actions {
            align-self: flex-end;
            flex-wrap: wrap;
          }
        }

        /* ════════════════════════════════════
           < 480px  (small mobile)
        ════════════════════════════════════ */
        @media (max-width: 480px) {
          .dash-wrapper {
            padding: 2.5rem 1rem 2rem;
          }
          .dash-heading {
            font-size: 1.75rem;
          }
          .sold-row-inner {
            padding: 0.9rem 1rem;
          }
        }
      `}</style>

        <div className="dash-wrapper">
          <div style={{ marginBottom: "2.5rem", position: "relative" }}>
            {/* ── Back button ── */}
            <button
              ref={backRef}
              className="dash-back-btn back-btn-circle"
              onClick={() => navigate(-1)}
              onMouseDown={onBackMouseDown}
              onTouchStart={onBackTouchStart}
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "50%",
                background: "var(--bg-surface)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: "1.5px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: draggable ? "grab" : "pointer",
                flexShrink: 0,
                color: "var(--text-muted)",
                fontFamily: "var(--font-body)",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--accent)";
                e.currentTarget.style.color = "var(--accent)";
                e.currentTarget.style.boxShadow =
                  "0 0 8px 2px rgba(var(--accent-rgb),0.35)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.color = "var(--text-muted)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            <h1
              className="dash-heading"
              style={{
                fontWeight: "900",
                letterSpacing: "-2px",
                lineHeight: "1.05",
                marginBottom: "0.6rem",
                color: "var(--text-primary)",
              }}
            >
              My
              <br />
              <span
                style={{
                  background:
                    "linear-gradient(135deg, var(--accent), var(--accent-alt))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Dashboard.
              </span>
            </h1>
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: "0.85rem",
                marginTop: "0.5rem",
                fontWeight: "400",
              }}
            >
              Welcome back, {username} — {activeCount} active listing
              {activeCount !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="dash-stats-row">
            {[
              { label: "Active", value: activeCount },
              { label: "Pending", value: pendingCount },
              { label: "Sold", value: soldCount },
              { label: "Total", value: items.length },
            ].map((stat) => (
              <div
                key={stat.label}
                style={{
                  background: "var(--glass-bg-row)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid var(--border)",
                  borderRadius: "14px",
                  padding: "0.85rem 1.25rem",
                  minWidth: "72px",
                  position: "relative",
                  overflow: "hidden",
                  boxShadow: "var(--shadow-card)",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "1px",
                    background:
                      "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)",
                  }}
                />
                <div
                  style={{
                    fontSize: "0.5rem",
                    letterSpacing: "1.5px",
                    textTransform: "uppercase",
                    color: "var(--text-muted)",
                    fontWeight: "700",
                    marginBottom: "0.25rem",
                  }}
                >
                  {stat.label}
                </div>
                <div
                  style={{
                    fontSize: "1.4rem",
                    fontWeight: "800",
                    color: "var(--text-secondary)",
                    letterSpacing: "-0.5px",
                  }}
                >
                  {stat.value}
                </div>
              </div>
            ))}
            <div style={{ flex: 1 }} />
            <button
              onClick={() => navigate("/post")}
              onMouseEnter={() => setPostBtnHovered(true)}
              onMouseLeave={() => setPostBtnHovered(false)}
              style={{
                padding: "0.85rem 1.75rem",
                background: postBtnHovered
                  ? "linear-gradient(135deg, var(--accent-alt), var(--accent))"
                  : "linear-gradient(135deg, var(--accent), var(--accent-alt))",
                color: "white",
                border: "none",
                borderRadius: "14px",
                fontSize: "0.8rem",
                fontWeight: "700",
                cursor: "pointer",
                letterSpacing: "1px",
                textTransform: "uppercase",
                transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                transform: postBtnHovered
                  ? "translateY(-3px)"
                  : "translateY(0)",
                boxShadow: postBtnHovered
                  ? "var(--shadow-accent-lg)"
                  : "var(--shadow-accent)",
                whiteSpace: "nowrap",
              }}
            >
              + Post New Item
            </button>
          </div>

          <div
            style={{
              height: "1px",
              background: "var(--glass-divider)",
              marginBottom: "1.5rem",
            }}
          />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "1.5rem",
              gap: "0.75rem",
              flexWrap: "wrap",
            }}
          >
            <div className="dash-filter-tabs" style={{ margin: 0 }}>
              {FILTERS.map((f) => {
                const isActive = activeFilter === f.key;
                return (
                  <button
                    key={f.key}
                    onClick={() => handleTabChange(f.key)}
                    style={{
                      padding: "0.55rem 1.4rem",
                      background: isActive
                        ? "linear-gradient(135deg, var(--accent), var(--accent-alt))"
                        : "var(--bg-card-hover)",
                      color: isActive ? "white" : "var(--text-secondary)",
                      border: isActive ? "none" : "1px solid var(--border)",
                      borderRadius: "12px",
                      cursor: "pointer",
                      fontSize: "0.85rem",
                      fontWeight: "700",
                      transition: "all 0.25s ease",
                      boxShadow: isActive ? "var(--shadow-accent)" : "none",
                    }}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
            {/* Select button — hidden on sold tab */}
            {!loading &&
              !error &&
              (() => {
                const listLen =
                  activeFilter === "active"
                    ? activeItems.length
                    : activeFilter === "pending"
                      ? pendingItems.length
                      : activeFilter === "sold"
                        ? visibleSoldGroups.length
                        : allNonSoldItems.length;
                if (listLen === 0) return null;
                return (
                  <button
                    onClick={() => {
                      if (selectMode) {
                        setSelectMode(false);
                        setSelected(new Set());
                        return;
                      }
                      setSelectMode(true);
                      if (listLen === 1) {
                        const singleId =
                          activeFilter === "active"
                            ? activeItems[0]?.id
                            : activeFilter === "pending"
                              ? pendingItems[0]?.id
                              : activeFilter === "sold"
                                ? visibleSoldGroups[0]?.groupKey
                                : (allNonSoldItems[0]?.id ??
                                  visibleSoldGroups[0]?.groupKey);
                        if (singleId != null) setSelected(new Set([singleId]));
                      }
                    }}
                    style={{
                      padding: "0.4rem 1rem",
                      borderRadius: "10px",
                      fontSize: "0.78rem",
                      fontWeight: "600",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      background: selectMode
                        ? "rgba(var(--accent-rgb),0.1)"
                        : "var(--bg-card)",
                      border: selectMode
                        ? "1px solid rgba(var(--accent-rgb),0.3)"
                        : "1px solid var(--border)",
                      color: selectMode ? "var(--accent)" : "var(--text-muted)",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    >
                      <polyline points="9 11 12 14 22 4" />
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                    </svg>
                    {selectMode ? "Cancel" : "Select"}
                  </button>
                );
              })()}
          </div>

          {/* ── Bulk toolbar ── */}
          {selectMode &&
            (() => {
              const listIds =
                activeFilter === "active"
                  ? activeItems.map((i) => i.id)
                  : activeFilter === "pending"
                    ? pendingItems.map((i) => i.id)
                    : activeFilter === "sold"
                      ? visibleSoldGroups.map((g) => g.groupKey).filter(Boolean)
                      : [
                          ...allNonSoldItems.map((i) => i.id),
                          ...visibleSoldGroups
                            .map((g) => g.groupKey)
                            .filter(Boolean),
                        ];
              const allSel =
                listIds.length > 0 && listIds.every((id) => selected.has(id));

              // Build action buttons per tab
              const actions = [];
              if (activeFilter === "active")
                actions.push({
                  key: "pending",
                  label: "Mark Pending",
                  bg: "rgba(251,189,35,0.12)",
                  border: "rgba(251,189,35,0.3)",
                  color: "#fbbf24",
                });
              if (activeFilter === "pending")
                actions.push({
                  key: "active",
                  label: "Mark Active",
                  bg: "rgba(81,207,102,0.12)",
                  border: "rgba(81,207,102,0.3)",
                  color: "#51cf66",
                });
              if (activeFilter === "all") {
                actions.push({
                  key: "active",
                  label: "Mark Active",
                  bg: "rgba(81,207,102,0.12)",
                  border: "rgba(81,207,102,0.3)",
                  color: "#51cf66",
                });
                actions.push({
                  key: "pending",
                  label: "Mark Pending",
                  bg: "rgba(251,189,35,0.12)",
                  border: "rgba(251,189,35,0.3)",
                  color: "#fbbf24",
                });
              }
              actions.push({
                key: "delete",
                label: "Delete",
                bg: "rgba(255,77,77,0.1)",
                border: "rgba(255,77,77,0.22)",
                color: "#ff6b6b",
                isDanger: true,
              });

              return (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background:
                      "linear-gradient(135deg, rgba(var(--accent-rgb),0.07) 0%, rgba(var(--accent-rgb),0.02) 100%)",
                    border: "1px solid rgba(var(--accent-rgb),0.18)",
                    borderRadius: "14px",
                    padding: "0.75rem 1.25rem",
                    marginBottom: "1rem",
                    flexWrap: "wrap",
                    gap: "0.5rem",
                    animation: "fadeSlideIn 0.2s ease",
                  }}
                >
                  <style>{`@keyframes fadeSlideIn { from { opacity:0; transform:translateY(-5px) } to { opacity:1; transform:translateY(0) } }`}</style>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                    }}
                  >
                    <span
                      style={{
                        color: "var(--text-muted)",
                        fontSize: "0.8rem",
                        fontWeight: "600",
                      }}
                    >
                      {selected.size} selected
                    </span>
                    <button
                      onClick={() => {
                        if (allSel) {
                          setSelected(new Set());
                          setSelectMode(false);
                        } else setSelected(new Set(listIds));
                      }}
                      style={{
                        padding: "0.3rem 0.8rem",
                        borderRadius: "8px",
                        fontSize: "0.75rem",
                        fontWeight: "600",
                        cursor: "pointer",
                        background: "var(--bg-card)",
                        border: "1px solid var(--border)",
                        color: "var(--text-muted)",
                        transition: "all 0.2s ease",
                        fontFamily: "var(--font-body)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "white";
                        e.currentTarget.style.background =
                          "rgba(255,255,255,0.1)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "rgba(255,255,255,0.45)";
                        e.currentTarget.style.background =
                          "rgba(255,255,255,0.05)";
                      }}
                    >
                      {allSel ? "Deselect All" : "Select All"}
                    </button>
                  </div>
                  <div
                    style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}
                  >
                    {actions.map((a) => (
                      <button
                        key={a.key}
                        disabled={selected.size === 0}
                        onClick={() => {
                          if (selected.size > 0)
                            setBulkConfirm({
                              action: a.key,
                              ids: [...selected],
                            });
                        }}
                        style={{
                          padding: "0.35rem 1rem",
                          borderRadius: "8px",
                          fontSize: "0.78rem",
                          fontWeight: "700",
                          cursor:
                            selected.size === 0 ? "not-allowed" : "pointer",
                          background:
                            selected.size > 0 ? a.bg : "rgba(255,255,255,0.03)",
                          border: `1px solid ${selected.size > 0 ? a.border : "rgba(255,255,255,0.05)"}`,
                          color:
                            selected.size > 0
                              ? a.color
                              : "rgba(255,255,255,0.2)",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.4rem",
                          transition: "all 0.2s ease",
                          fontFamily: "var(--font-body)",
                        }}
                      >
                        {a.isDanger && (
                          <svg
                            width="11"
                            height="11"
                            viewBox="0 0 16 17"
                            fill="none"
                          >
                            <path
                              d="M2 4h12"
                              stroke="currentColor"
                              strokeWidth="1.6"
                              strokeLinecap="round"
                            />
                            <path
                              d="M6 4V2.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5V4"
                              stroke="currentColor"
                              strokeWidth="1.6"
                              strokeLinecap="round"
                            />
                            <path
                              d="M3.5 4.5l.75 9.5a.75.75 0 0 0 .75.75h6a.75.75 0 0 0 .75-.75l.75-9.5"
                              stroke="currentColor"
                              strokeWidth="1.6"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                        {a.key === "delete"
                          ? `Delete${selected.size > 0 ? ` (${selected.size})` : ""}`
                          : a.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}

          {/* ── Bulk confirm modal ── */}
          {bulkConfirm &&
            createPortal(
              <div
                onClick={() => setBulkConfirm(null)}
                style={{
                  position: "fixed",
                  inset: 0,
                  zIndex: 9999,
                  background: "rgba(0,0,0,0.65)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  animation: "cdFadeIn 0.18s ease",
                }}
              >
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(22,20,30,0.98) 0%, rgba(14,12,20,0.98) 100%)",
                    border: "1px solid var(--border-hover)",
                    borderRadius: "20px",
                    padding: "2rem",
                    width: "380px",
                    maxWidth: "90vw",
                    boxShadow: "0 40px 80px rgba(0,0,0,0.6)",
                    position: "relative",
                    overflow: "hidden",
                    animation:
                      "cdSlideUp 0.22s cubic-bezier(0.175,0.885,0.32,1.275)",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: "1px",
                      background: `linear-gradient(90deg, transparent, ${bulkConfirm.action === "delete" ? "rgba(255,107,107,0.4)" : bulkConfirm.action === "pending" ? "rgba(251,189,35,0.4)" : "rgba(81,207,102,0.4)"}, transparent)`,
                    }}
                  />
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "14px",
                      margin: "0 auto 1.25rem",
                      background:
                        bulkConfirm.action === "delete"
                          ? "rgba(255,107,107,0.1)"
                          : bulkConfirm.action === "pending"
                            ? "rgba(251,189,35,0.1)"
                            : "rgba(81,207,102,0.1)",
                      border: `1px solid ${bulkConfirm.action === "delete" ? "rgba(255,107,107,0.2)" : bulkConfirm.action === "pending" ? "rgba(251,189,35,0.2)" : "rgba(81,207,102,0.2)"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {bulkConfirm.action === "delete" ? (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#ff6b6b"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14H6L5 6" />
                        <path d="M10 11v6M14 11v6" />
                        <path d="M9 6V4h6v2" />
                      </svg>
                    ) : (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={
                          bulkConfirm.action === "pending"
                            ? "#fbbf24"
                            : "#51cf66"
                        }
                        strokeWidth="2.2"
                        strokeLinecap="round"
                      >
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    )}
                  </div>
                  <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                    <div
                      style={{
                        fontSize: "1rem",
                        fontWeight: "800",
                        color: "var(--text-primary)",
                        marginBottom: "0.5rem",
                        letterSpacing: "-0.3px",
                      }}
                    >
                      {bulkConfirm.action === "delete" &&
                        `Delete ${bulkConfirm.ids.length} listing${bulkConfirm.ids.length > 1 ? "s" : ""}?`}
                      {bulkConfirm.action === "pending" &&
                        `Mark ${bulkConfirm.ids.length} listing${bulkConfirm.ids.length > 1 ? "s" : ""} as Pending?`}
                      {bulkConfirm.action === "active" &&
                        `Mark ${bulkConfirm.ids.length} listing${bulkConfirm.ids.length > 1 ? "s" : ""} as Active?`}
                    </div>
                    <div
                      style={{
                        fontSize: "0.82rem",
                        color: "var(--text-muted)",
                        lineHeight: "1.5",
                      }}
                    >
                      {bulkConfirm.action === "delete" &&
                        "Permanently removes all selected listings and their images. Cannot be undone."}
                      {bulkConfirm.action === "pending" &&
                        "Active listings will be marked as pending. Already-pending ones are unchanged."}
                      {bulkConfirm.action === "active" &&
                        "Pending listings will be made active again. Already-active ones are unchanged."}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "0.65rem" }}>
                    <button
                      onClick={() => setBulkConfirm(null)}
                      style={{
                        flex: 1,
                        padding: "0.75rem",
                        background: "var(--bg-card)",
                        border: "1px solid var(--border)",
                        borderRadius: "12px",
                        cursor: "pointer",
                        fontSize: "0.85rem",
                        fontWeight: "700",
                        color: "var(--text-muted)",
                        fontFamily: "var(--font-body)",
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() =>
                        executeBulkAction(bulkConfirm.action, bulkConfirm.ids)
                      }
                      style={{
                        flex: 1,
                        padding: "0.75rem",
                        background:
                          bulkConfirm.action === "delete"
                            ? "linear-gradient(135deg, rgba(255,107,107,0.9), rgba(220,53,69,0.9))"
                            : bulkConfirm.action === "pending"
                              ? "linear-gradient(135deg, rgba(251,189,35,0.9), rgba(220,160,20,0.9))"
                              : "linear-gradient(135deg, rgba(81,207,102,0.9), rgba(55,178,77,0.9))",
                        border: "none",
                        borderRadius: "12px",
                        cursor: "pointer",
                        fontSize: "0.85rem",
                        fontWeight: "700",
                        color: "white",
                        fontFamily: "var(--font-body)",
                      }}
                    >
                      Confirm
                    </button>
                  </div>
                </div>
              </div>,
              document.body,
            )}

          <p
            style={{
              color: "var(--text-ghost)",
              fontSize: "0.7rem",
              marginBottom: "1rem",
              fontWeight: "700",
              letterSpacing: "1.5px",
              textTransform: "uppercase",
            }}
          >
            {sectionLabel[activeFilter]}
          </p>

          {loading && (
            <div style={{ textAlign: "center", padding: "4rem 2rem" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  border: "3px solid rgba(255,255,255,0.08)",
                  borderTop: "3px solid var(--accent)",
                  borderRadius: "50%",
                  margin: "0 auto 1rem",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }
        @keyframes dashSpin { to { transform: rotate(360deg); } }`}</style>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                Loading your dashboard...
              </p>
            </div>
          )}

          {!loading && error && (
            <div
              style={{
                textAlign: "center",
                padding: "3rem 2rem",
                background: "rgba(255,107,107,0.08)",
                border: "1px solid rgba(255,107,107,0.15)",
                borderRadius: "20px",
                color: "#ff6b6b",
              }}
            >
              <p>{error}</p>
            </div>
          )}

          {!loading &&
            !error &&
            (activeFilter === "active" || activeFilter === "pending") &&
            (() => {
              const list =
                activeFilter === "active" ? activeItems : pendingItems;
              if (list.length === 0)
                return <EmptyState label={activeFilter + " listings"} />;
              return (
                <div
                  key={gridSize}
                  style={{
                    display: "grid",
                    animation:
                      "gridSwitchScale 0.4s cubic-bezier(0.19, 1, 0.22, 1) forwards",
                    gridTemplateColumns:
                      gridSize === 1
                        ? "1fr"
                        : gridSize === 2
                          ? "repeat(auto-fill, minmax(360px, 1fr))"
                          : "repeat(auto-fill, minmax(280px, 1fr))",
                    gap: gridSize === 1 ? "0.75rem" : "1.25rem",
                  }}
                >
                  {list.map((item) => (
                    <ListingRow
                      key={item.id}
                      item={item}
                      onDelete={handleDelete}
                      onUpdate={handleUpdate}
                      isHighlighted={highlightItemId === item.id}
                      selectMode={selectMode}
                      selected={selected.has(item.id)}
                      onToggle={() => toggleSelect(item.id)}
                      gridSize={gridSize}
                    />
                  ))}
                </div>
              );
            })()}

          {!loading &&
            !error &&
            activeFilter === "all" &&
            (() => {
              if (allNonSoldItems.length === 0 && soldGroups.length === 0)
                return <EmptyState label="listings" />;
              return (
                <div
                  key={gridSize}
                  style={{
                    display: "grid",
                    animation:
                      "gridSwitchScale 0.4s cubic-bezier(0.19, 1, 0.22, 1) forwards",
                    gridTemplateColumns:
                      gridSize === 1
                        ? "1fr"
                        : gridSize === 2
                          ? "repeat(auto-fill, minmax(360px, 1fr))"
                          : "repeat(auto-fill, minmax(280px, 1fr))",
                    gap: gridSize === 1 ? "0.75rem" : "1.25rem",
                  }}
                >
                  {allNonSoldItems.map((item) => (
                    <ListingRow
                      key={item.id}
                      item={item}
                      onDelete={handleDelete}
                      onUpdate={handleUpdate}
                      isHighlighted={highlightItemId === item.id}
                      selectMode={selectMode}
                      selected={selected.has(item.id)}
                      onToggle={() => toggleSelect(item.id)}
                      gridSize={gridSize}
                    />
                  ))}
                  {visibleSoldGroups.map((group) => (
                    <SoldGroupRow
                      key={group.stableKey}
                      group={group}
                      stableKey={group.stableKey}
                      isNewSale={
                        group.groupKey != null &&
                        freshSaleItemIds.has(group.groupKey)
                      }
                      isHighlighted={
                        highlightItemId != null &&
                        group.groupKey === highlightItemId
                      }
                      onDelete={handleDelete}
                      selectMode={selectMode}
                      selected={
                        group.groupKey != null && selected.has(group.groupKey)
                      }
                      onToggle={() => {
                        if (group.groupKey != null)
                          toggleSelect(group.groupKey);
                      }}
                      gridSize={gridSize}
                    />
                  ))}
                </div>
              );
            })()}

          {!loading &&
            !error &&
            activeFilter === "sold" &&
            (() => {
              if (visibleSoldGroups.length === 0)
                return <EmptyState label="sold items" />;
              return (
                <div
                  key={gridSize}
                  style={{
                    display: "grid",
                    animation:
                      "gridSwitchScale 0.4s cubic-bezier(0.19, 1, 0.22, 1) forwards",
                    gridTemplateColumns:
                      gridSize === 1
                        ? "1fr"
                        : gridSize === 2
                          ? "repeat(auto-fill, minmax(360px, 1fr))"
                          : "repeat(auto-fill, minmax(280px, 1fr))",
                    gap: gridSize === 1 ? "0.75rem" : "1.25rem",
                  }}
                >
                  {visibleSoldGroups.map((group) => (
                    <SoldGroupRow
                      key={group.stableKey}
                      group={group}
                      stableKey={group.stableKey}
                      isNewSale={
                        group.groupKey != null &&
                        freshSaleItemIds.has(group.groupKey)
                      }
                      isHighlighted={
                        highlightItemId != null &&
                        group.groupKey === highlightItemId
                      }
                      onDelete={handleDelete}
                      selectMode={selectMode}
                      selected={
                        group.groupKey != null && selected.has(group.groupKey)
                      }
                      onToggle={() => {
                        if (group.groupKey != null)
                          toggleSelect(group.groupKey);
                      }}
                      gridSize={gridSize}
                    />
                  ))}
                </div>
              );
            })()}
        </div>
      </div>
    </>
  );
}

export default Dashboard;
