const { ObjectId } = require("mongodb");

// --- ObjectId helper ---
function getObjectId(idStr) {
  try {
    return new ObjectId(idStr);
  } catch {
    return null;
  }
}

// --- Serialize a MongoDB document (converts ObjectId → string, Date → ISO) ---
function serializeDoc(doc) {
  if (doc === null || doc === undefined) return null;

  const result = {};
  for (const [key, value] of Object.entries(doc)) {
    if (value instanceof ObjectId) {
      result[key] = value.toString();
    } else if (value instanceof Date) {
      result[key] = value.toISOString();
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) => {
        if (item instanceof ObjectId) return item.toString();
        if (typeof item === "object" && item !== null)
          return serializeDoc(item);
        return item;
      });
    } else if (typeof value === "object" && value !== null) {
      result[key] = serializeDoc(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

function getCurrentTimestamp() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
}

function getMonthYear() {
  return new Date().toLocaleString("en-US", { month: "long", year: "numeric" });
}

function getYearMonth() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}`;
}

// --- Standardized API response
function createResponse(status = "success", message = "", data = null) {
  const response = { status, message };
  if (data !== null) Object.assign(response, data);
  return response;
}

module.exports = {
  getObjectId,
  serializeDoc,
  getCurrentTimestamp,
  getMonthYear,
  getYearMonth,
  createResponse,
};
