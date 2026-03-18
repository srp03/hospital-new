const express = require('express');
const { authMiddleware, optionalAuth } = require('../middleware/auth');

// Import all models
const Profile = require('../models/Profile');
const Department = require('../models/Department');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const LabTechnician = require('../models/LabTechnician');
const Appointment = require('../models/Appointment');
const Vital = require('../models/Vital');
const Prescription = require('../models/Prescription');
const LabRequest = require('../models/LabRequest');
const LabReport = require('../models/LabReport');
const Billing = require('../models/Billing');
const Bed = require('../models/Bed');

const router = express.Router();

// Table name -> Mongoose model mapping
const modelMap = {
  profiles: Profile,
  departments: Department,
  patients: Patient,
  doctors: Doctor,
  lab_technicians: LabTechnician,
  appointments: Appointment,
  vitals: Vital,
  prescriptions: Prescription,
  lab_requests: LabRequest,
  lab_reports: LabReport,
  billing: Billing,
  beds: Bed,
};

// Relation mapping for Supabase-style joins
// e.g. "patients(full_name, patient_uid)" -> populate 'patient_id' from 'patients'
const relationFieldMap = {
  appointments: {
    patients: 'patient_id',
    doctors: 'doctor_id',
  },
  prescriptions: {
    patients: 'patient_id',
    doctors: 'doctor_id',
  },
  lab_requests: {
    patients: 'patient_id',
    doctors: 'doctor_id',
  },
  lab_reports: {
    patients: 'patient_id',
    lab_requests: 'lab_request_id',
  },
  billing: {
    patients: 'patient_id',
  },
  vitals: {
    patients: 'patient_id',
  },
  doctors: {
    departments: 'department_id',
  },
};

/**
 * Parse Supabase-style select strings to determine fields and relations.
 * Examples:
 *   "*" -> select all fields, no population
 *   "*, patients(full_name, patient_uid)" -> select all + populate patient_id, project specific fields
 *   "id, full_name" -> select only id and full_name
 *   "status" -> select only status field
 */
function parseSelect(selectStr, tableName) {
  if (!selectStr) return { fields: null, populates: [] };

  const populates = [];
  // Extract relation patterns like "patients(full_name, patient_uid)"
  const relationRegex = /(\w+)\(([^)]+)\)/g;
  let cleaned = selectStr;
  let match;

  while ((match = relationRegex.exec(selectStr)) !== null) {
    const relatedTable = match[1]; // e.g. "patients"
    const relatedFields = match[2].split(',').map(f => f.trim()); // e.g. ["full_name", "patient_uid"]

    // Find the local field that references this table
    const tableRelations = relationFieldMap[tableName] || {};
    const localField = tableRelations[relatedTable];

    if (localField) {
      populates.push({
        path: localField,
        select: relatedFields.join(' ') + ' _id',
        alias: relatedTable, // The key name the frontend expects
      });
    }

    // Remove the relation from the select string
    cleaned = cleaned.replace(match[0], '');
  }

  // Clean up remaining select fields
  cleaned = cleaned.replace(/,\s*,/g, ',').replace(/^,\s*|,\s*$/g, '').trim();

  let fields = null;
  if (cleaned && cleaned !== '*') {
    fields = cleaned.split(',').map(f => f.trim()).filter(Boolean);
  }

  return { fields, populates };
}

/**
 * Build a MongoDB filter from Supabase-style filter array
 * Each filter: { column, operator, value }
 * Operators: eq, neq, gt, gte, lt, lte, like, ilike, in, is
 */
function buildFilter(filters) {
  const mongoFilter = {};

  if (!filters || !Array.isArray(filters)) return mongoFilter;

  for (const f of filters) {
    const { column, operator, value } = f;
    // Map _id and id interchangeably
    const col = column === 'id' ? '_id' : column;

    switch (operator) {
      case 'eq':
        mongoFilter[col] = value;
        break;
      case 'neq':
        mongoFilter[col] = { $ne: value };
        break;
      case 'gt':
        mongoFilter[col] = { ...(mongoFilter[col] || {}), $gt: value };
        break;
      case 'gte':
        mongoFilter[col] = { ...(mongoFilter[col] || {}), $gte: value };
        break;
      case 'lt':
        mongoFilter[col] = { ...(mongoFilter[col] || {}), $lt: value };
        break;
      case 'lte':
        mongoFilter[col] = { ...(mongoFilter[col] || {}), $lte: value };
        break;
      case 'like':
        mongoFilter[col] = { $regex: value.replace(/%/g, '.*'), $options: '' };
        break;
      case 'ilike':
        mongoFilter[col] = { $regex: value.replace(/%/g, '.*'), $options: 'i' };
        break;
      case 'in':
        mongoFilter[col] = { $in: Array.isArray(value) ? value : [value] };
        break;
      case 'is':
        mongoFilter[col] = value === null ? null : value;
        break;
      default:
        mongoFilter[col] = value;
    }
  }

  return mongoFilter;
}

/**
 * Handle Supabase-style .or() filter
 * Format: "field1.op.value,field2.op.value"
 * Example: "full_name.ilike.%john%,patient_uid.ilike.%john%"
 */
function parseOrFilter(orString) {
  if (!orString) return null;

  const conditions = orString.split(',').map(cond => {
    const parts = cond.split('.');
    if (parts.length < 3) return null;

    const column = parts[0] === 'id' ? '_id' : parts[0];
    const operator = parts[1];
    const value = parts.slice(2).join('.');

    switch (operator) {
      case 'eq': return { [column]: value };
      case 'neq': return { [column]: { $ne: value } };
      case 'ilike': return { [column]: { $regex: value.replace(/%/g, '.*'), $options: 'i' } };
      case 'like': return { [column]: { $regex: value.replace(/%/g, '.*') } };
      case 'gt': return { [column]: { $gt: value } };
      case 'gte': return { [column]: { $gte: value } };
      case 'lt': return { [column]: { $lt: value } };
      case 'lte': return { [column]: { $lte: value } };
      default: return { [column]: value };
    }
  }).filter(Boolean);

  return conditions.length > 0 ? { $or: conditions } : null;
}

// POST /api/query — Universal query endpoint
router.post('/', optionalAuth, async (req, res) => {
  try {
    const {
      table,
      operation, // 'select', 'insert', 'update', 'delete'
      select: selectStr,
      filters,
      orFilter,
      order,
      limit: limitVal,
      single,
      data: bodyData,
      returnData,
    } = req.body;

    const Model = modelMap[table];
    if (!Model) {
      return res.status(400).json({ data: null, error: { message: `Unknown table: ${table}` } });
    }

    // ===== SELECT =====
    if (operation === 'select') {
      const { fields, populates } = parseSelect(selectStr, table);
      const mongoFilter = buildFilter(filters);

      // Handle .or() filter
      if (orFilter) {
        const orConditions = parseOrFilter(orFilter);
        if (orConditions) {
          Object.assign(mongoFilter, orConditions);
        }
      }

      let query = Model.find(mongoFilter);

      if (fields) {
        query = query.select(fields.join(' '));
      }

      // Apply populates
      for (const pop of populates) {
        query = query.populate({ path: pop.path, select: pop.select });
      }

      // Apply ordering
      if (order && order.length > 0) {
        const sortObj = {};
        for (const o of order) {
          sortObj[o.column === 'id' ? '_id' : o.column] = o.ascending ? 1 : -1;
        }
        query = query.sort(sortObj);
      }

      // Apply limit
      if (limitVal) {
        query = query.limit(limitVal);
      }

      let data = await query.lean();

      // Add 'id' field alias and remap populated fields
      data = data.map(doc => transformDocument(doc, populates));

      // Handle .single()
      if (single) {
        if (data.length === 0) {
          return res.json({ data: null, error: { message: 'No rows found', code: 'PGRST116' } });
        }
        return res.json({ data: data[0], error: null });
      }

      return res.json({ data, error: null });
    }

    // ===== INSERT =====
    if (operation === 'insert') {
      let insertData = bodyData;

      // Handle _id/id mapping
      if (insertData && insertData.id) {
        insertData._id = insertData.id;
        delete insertData.id;
      }

      const doc = await Model.create(insertData);
      const result = transformDocument(doc.toObject(), []);

      if (returnData) {
        return res.status(201).json({ data: [result], error: null });
      }

      return res.status(201).json({ data: result, error: null });
    }

    // ===== UPDATE =====
    if (operation === 'update') {
      const mongoFilter = buildFilter(filters);
      const updateData = bodyData;

      // Handle _id/id mapping
      if (updateData && updateData.id) {
        updateData._id = updateData.id;
        delete updateData.id;
      }

      const result = await Model.updateMany(mongoFilter, { $set: updateData });

      return res.json({ data: null, error: null, count: result.modifiedCount });
    }

    // ===== DELETE =====
    if (operation === 'delete') {
      const mongoFilter = buildFilter(filters);
      const result = await Model.deleteMany(mongoFilter);
      return res.json({ data: null, error: null, count: result.deletedCount });
    }

    return res.status(400).json({ data: null, error: { message: `Unknown operation: ${operation}` } });

  } catch (error) {
    console.error('Query error:', error);
    return res.status(500).json({ data: null, error: { message: error.message } });
  }
});

/**
 * Transform a MongoDB document for Supabase-compatible output:
 * 1. Add 'id' alias from '_id'
 * 2. Remap populated fields from local field names to Supabase relation names
 *    e.g., doc.patient_id (populated) -> doc.patients
 */
function transformDocument(doc, populates) {
  if (!doc) return doc;

  const transformed = { ...doc };
  transformed.id = transformed._id;

  // Remap populated relations
  for (const pop of populates) {
    if (transformed[pop.path] && typeof transformed[pop.path] === 'object') {
      // Rename populated field from local field name to Supabase table alias
      const populated = transformed[pop.path];
      if (populated && populated._id) {
        populated.id = populated._id;
      }
      transformed[pop.alias] = populated;
      // Keep the original field as the ID value for backwards compat
      transformed[pop.path] = populated?._id || populated?.id || transformed[pop.path];
    }
  }

  delete transformed.__v;
  return transformed;
}

module.exports = router;
