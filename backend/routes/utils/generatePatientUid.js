const Patient = require('../models/Patient');

async function generatePatientUid() {
  const year = new Date().getFullYear();
  const prefix = `PAT-${year}-`;

  // Find the last patient UID for this year
  const lastPatient = await Patient.findOne({
    patient_uid: { $regex: `^${prefix}` }
  }).sort({ patient_uid: -1 });

  let nextNum = 1;
  if (lastPatient && lastPatient.patient_uid) {
    const lastNum = parseInt(lastPatient.patient_uid.replace(prefix, ''), 10);
    if (!isNaN(lastNum)) {
      nextNum = lastNum + 1;
    }
  }

  return `${prefix}${String(nextNum).padStart(4, '0')}`;
}

module.exports = generatePatientUid;
