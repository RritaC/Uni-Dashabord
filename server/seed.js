import { dbQuery, dbGet, dbRun } from './db-helper.js';

const GENERAL_COLUMNS = [
    { key: 'nr', label: 'Nr', type: 'number', section: 'Basics', pinned: true, order_index: 0 },
    { key: 'uni_name', label: 'Uni Name', type: 'text', section: 'Basics', pinned: true, order_index: 1 },
    { key: 'cntr', label: 'Cntr.', type: 'text', section: 'Basics', pinned: true, order_index: 2 },
    { key: 'state', label: 'State', type: 'text', section: 'Basics', pinned: false, order_index: 3 },
    { key: 'city', label: 'City', type: 'text', section: 'Basics', pinned: false, order_index: 4 },
    { key: 'uni_type', label: 'Uni type', type: 'select', section: 'Basics', select_options: JSON.stringify(['Public', 'Private']), pinned: false, order_index: 5 },
    { key: 'web', label: 'Web', type: 'link', section: 'Basics', pinned: false, order_index: 6 },
    { key: 'best_departments', label: 'Best Departments', type: 'long-text', section: 'Academics', pinned: false, order_index: 7 },
    { key: 'program_of_interest', label: 'Program of Interest', type: 'text', section: 'Academics', pinned: false, order_index: 8 },
    { key: 'program_length', label: 'Program Length', type: 'text', section: 'Academics', pinned: false, order_index: 9 },
    { key: 'entry_requirements', label: 'Entry Requirements', type: 'long-text', section: 'Admissions', pinned: false, order_index: 10 },
    { key: 'acceptance_rate', label: 'Acceptance Rate', type: 'number', section: 'Admissions', pinned: false, order_index: 11 },
    { key: 'language_requirement', label: 'Language Requirement', type: 'text', section: 'Admissions', pinned: false, order_index: 12 },
    { key: 'application_deadlines', label: 'Application Deadlines', type: 'date', section: 'Admissions', pinned: false, order_index: 13 },
    { key: 'deadline_type', label: 'Deadline Type', type: 'text', section: 'Admissions', pinned: false, order_index: 14 },
    { key: 'tuition_fees_yearly', label: 'Tuition Fees (Yearly)', type: 'number', section: 'Costs', pinned: false, order_index: 15 },
    { key: 'financial_aid_available', label: 'Financial Aid Available', type: 'boolean', section: 'Costs', pinned: false, order_index: 16 },
    { key: 'type_of_aid', label: 'Type of Aid', type: 'text', section: 'Costs', pinned: false, order_index: 17 },
    { key: 'aid_coverage', label: 'Aid Coverage', type: 'text', section: 'Costs', pinned: false, order_index: 18 },
    { key: 'average_aid_given', label: 'Average Aid Given', type: 'number', section: 'Costs', pinned: false, order_index: 19 },
    { key: 'application_for_aid', label: 'Application for Aid', type: 'text', section: 'Costs', pinned: false, order_index: 20 },
    { key: 'cost_of_living_estimate', label: 'Cost of Living Estimate', type: 'number', section: 'Costs', pinned: false, order_index: 21 },
    { key: 'startup_grants', label: 'Start-up Grants', type: 'text', section: 'Costs', pinned: false, order_index: 22 },
    { key: 'financial_notes', label: 'Financial Notes', type: 'long-text', section: 'Costs', pinned: false, order_index: 23 },
    { key: 'on_campus_housing', label: 'On-Campus Housing', type: 'boolean', section: 'Housing', pinned: false, order_index: 24 },
    { key: 'housing_cost_monthly', label: 'Housing Cost (Monthly)', type: 'number', section: 'Housing', pinned: false, order_index: 25 },
    { key: 'off_campus_options', label: 'Off-Campus Options', type: 'text', section: 'Housing', pinned: false, order_index: 26 },
    { key: 'average_rent', label: 'Average Rent', type: 'number', section: 'Housing', pinned: false, order_index: 27 },
    { key: 'meal_plans', label: 'Meal Plans', type: 'text', section: 'Housing', pinned: false, order_index: 28 },
    { key: 'transportation', label: 'Transportation', type: 'text', section: 'Housing', pinned: false, order_index: 29 },
    { key: 'safety_rating', label: 'Safety Rating', type: 'number', section: 'Housing', pinned: false, order_index: 30 },
    { key: 'student_community', label: 'Student Community', type: 'text', section: 'Housing', pinned: false, order_index: 31 },
    { key: 'health_insurance_required', label: 'Health Insurance Required', type: 'boolean', section: 'Visa', pinned: false, order_index: 32 },
    { key: 'insurance_cost_yearly', label: 'Insurance Cost (Yearly)', type: 'number', section: 'Visa', pinned: false, order_index: 33 },
    { key: 'whats_covered', label: "What's Covered", type: 'text', section: 'Visa', pinned: false, order_index: 34 },
    { key: 'additional_insurance_options', label: 'Additional Insurance Options', type: 'text', section: 'Visa', pinned: false, order_index: 35 },
    { key: 'vaccination_requirements', label: 'Vaccination Requirements', type: 'text', section: 'Visa', pinned: false, order_index: 36 },
    { key: 'startup_support', label: 'Startup Support', type: 'text', section: 'Culture', pinned: false, order_index: 37 },
    { key: 'internships', label: 'Internships', type: 'text', section: 'Culture', pinned: false, order_index: 38 },
    { key: 'career_center_services', label: 'Career Center Services', type: 'text', section: 'Culture', pinned: false, order_index: 39 },
    { key: 'work_on_student_visa', label: 'Work on Student Visa', type: 'boolean', section: 'Visa', pinned: false, order_index: 40 },
    { key: 'post_grad_work_visa', label: 'Post-Grad Work Visa', type: 'text', section: 'Visa', pinned: false, order_index: 41 },
    { key: 'employment_rate_after_grad', label: 'Employment Rate After Grad', type: 'number', section: 'Culture', pinned: false, order_index: 42 },
    { key: 'student_visa_requirements', label: 'Student Visa Requirements', type: 'long-text', section: 'Visa', pinned: false, order_index: 43 },
    { key: 'visa_duration', label: 'Visa Duration', type: 'text', section: 'Visa', pinned: false, order_index: 44 },
    { key: 'working_limits', label: 'Working Limits', type: 'text', section: 'Visa', pinned: false, order_index: 45 },
    { key: 'taxes_on_income', label: 'Taxes on Income', type: 'text', section: 'Visa', pinned: false, order_index: 46 },
    { key: 'tax_treaties', label: 'Tax Treaties', type: 'text', section: 'Visa', pinned: false, order_index: 47 },
    { key: 'banking_for_intl_students', label: "Banking for Int'l Students", type: 'text', section: 'Visa', pinned: false, order_index: 48 },
    { key: 'local_id_registration_needed', label: 'Local ID/Registration Needed', type: 'boolean', section: 'Visa', pinned: false, order_index: 49 },
    { key: 'university_culture', label: 'University Culture', type: 'long-text', section: 'Culture', pinned: false, order_index: 50 },
    { key: 'clubs_activities', label: 'Clubs & Activities', type: 'text', section: 'Culture', pinned: false, order_index: 51 },
    { key: 'notable_alumni', label: 'Notable Alumni', type: 'long-text', section: 'Culture', pinned: false, order_index: 52 },
];

const UNIVERSITIES = [
    { name: 'MIT', country: 'US', state: 'Massachusetts', city: 'Cambridge', type: 'Private', website: 'https://www.mit.edu' },
    { name: 'Cambridge', country: 'BRIT', state: null, city: 'Cambridge', type: 'Public', website: 'https://www.cam.ac.uk' },
    { name: 'Oxford', country: 'BRIT', state: null, city: 'Oxford', type: 'Public', website: 'https://www.ox.ac.uk' },
    { name: 'Harvard', country: 'US', state: 'Massachusetts', city: 'Cambridge', type: 'Private', website: 'https://www.harvard.edu' },
    { name: 'Stanford', country: 'US', state: 'California', city: 'Stanford', type: 'Private', website: 'https://www.stanford.edu/' },
    { name: 'Imperial College London', country: 'BRIT', state: null, city: 'London', type: 'Public', website: 'https://www.imperial.ac.uk' },
    { name: 'UCL', country: 'BRIT', state: null, city: 'London', type: 'Public', website: 'https://www.ucl.ac.uk' },
    { name: 'Caltech', country: 'US', state: 'California', city: 'Pasadena', type: 'Private', website: 'https://www.caltech.edu' },
    { name: 'University of Chicago', country: 'US', state: 'Illinois', city: 'Chicago', type: 'Private', website: 'https://www.uchicago.edu' },
    { name: 'University of Pennsylvania', country: 'US', state: 'Pennsylvania', city: 'Philadelphia', type: 'Private', website: 'https://www.upenn.edu' },
    { name: 'Yale', country: 'US', state: 'Connecticut', city: 'New Haven', type: 'Private', website: 'https://www.yale.edu' },
    { name: 'Columbia', country: 'US', state: 'New York', city: 'New York City', type: 'Private', website: 'https://www.columbia.edu' },
    { name: 'Princeton', country: 'US', state: 'New Jersey', city: 'Princeton', type: 'Private', website: 'https://www.princeton.edu' },
    { name: 'Cornell', country: 'US', state: 'New York', city: 'Ithaca', type: 'Private', website: 'https://www.cornell.edu' },
    { name: 'University of Edinburgh', country: 'BRIT', state: null, city: 'Edinburgh', type: 'Public', website: 'https://www.ed.ac.uk' },
    { name: 'Johns Hopkins', country: 'US', state: 'Maryland', city: 'Baltimore', type: 'Private', website: 'https://www.jhu.edu' },
    { name: 'UC Berkeley', country: 'US', state: 'California', city: 'Berkeley', type: 'Public', website: 'https://www.berkeley.edu' },
    { name: 'UCLA', country: 'US', state: 'California', city: 'Los Angeles', type: 'Public', website: 'https://www.ucla.edu' },
    { name: 'University of Michigan', country: 'US', state: 'Michigan', city: 'Ann Arbor', type: 'Public', website: 'https://www.umich.edu' },
    { name: 'Northwestern', country: 'US', state: 'Illinois', city: 'Evanston', type: 'Private', website: 'https://www.northwestern.edu' },
    { name: "King's College", country: 'BRIT', state: null, city: 'London', type: 'Public', website: 'https://www.kcl.ac.uk' },
    { name: 'LSE', country: 'BRIT', state: null, city: 'London', type: 'Public', website: 'https://www.lse.ac.uk' },
    { name: 'Duke', country: 'US', state: 'North Carolina', city: 'Durham', type: 'Private', website: 'https://www.duke.edu' },
    { name: 'University of Washington', country: 'US', state: 'Washington', city: 'Seattle', type: 'Public', website: 'https://www.washington.edu' },
    { name: 'University of Manchester', country: 'BRIT', state: null, city: 'Manchester', type: 'Public', website: 'https://www.manchester.ac.uk' },
    { name: 'Carnegie Mellon', country: 'US', state: 'Pennsylvania', city: 'Manchester', type: 'Private', website: 'https://www.cmu.edu' },
    { name: 'University of Bristol', country: 'BRIT', state: null, city: 'Bristol', type: 'Public', website: 'https://www.bristol.ac.uk' },
    { name: 'University of Warwick', country: 'BRIT', state: null, city: 'Coventry', type: 'Public', website: 'https://warwick.ac.uk' },
    { name: 'Brown', country: 'US', state: 'Rhode Island', city: 'Providence', type: 'Private', website: 'https://www.brown.edu' },
    { name: 'NYU', country: 'US', state: 'New York', city: 'New York City', type: 'Private', website: 'https://www.nyu.edu' },
];

export async function seedDatabase() {
    // Check if General view exists
    let viewId = null;
    const checkView = await dbGet('SELECT id FROM views WHERE name = ?', ['General']);

    if (checkView) {
        viewId = checkView.id;
    } else {
        console.log('Seeding database...');
        // Create General view
        const viewResult = await dbRun('INSERT INTO views (name) VALUES (?)', ['General']);
        viewId = viewResult.lastInsertRowid;
    }

    // Always ensure universities and values are populated
    console.log('Ensuring universities and values are populated...');

    const uniIds = [];
    for (const uni of UNIVERSITIES) {
        // Check if university already exists
        const existing = await dbGet('SELECT id FROM universities WHERE name = ?', [uni.name]);
        if (existing) {
            uniIds.push(existing.id);
        } else {
            const result = await dbRun(`
                INSERT INTO universities (name, country, state, city, type, website)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [uni.name, uni.country, uni.state, uni.city, uni.type, uni.website]);
            uniIds.push(result.lastInsertRowid);
        }
    }

    // Insert columns if they don't exist
    for (const col of GENERAL_COLUMNS) {
        // Check if column already exists
        const existing = await dbGet('SELECT id FROM columns WHERE view_id = ? AND key = ?', [viewId, col.key]);
        if (!existing) {
            await dbRun(`
                INSERT INTO columns (view_id, key, label, type, section, select_options, pinned, visible, order_index)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                viewId,
                col.key,
                col.label,
                col.type,
                col.section,
                col.select_options || null,
                col.pinned ? 1 : 0,
                1,
                col.order_index
            ]);
        }
    }

    // Set initial values for basic columns (always update to ensure they're set)
    for (let index = 0; index < uniIds.length; index++) {
        const uniId = uniIds[index];
        const uni = UNIVERSITIES[index];
        if (uniId && viewId) {
            await dbRun(`
                INSERT INTO "values" (university_id, column_key, view_id, value)
                VALUES (?, ?, ?, ?)
                ON CONFLICT (university_id, column_key, view_id) 
                DO UPDATE SET value = EXCLUDED.value
            `, [uniId, 'nr', viewId, index + 1]);
            await dbRun(`
                INSERT INTO "values" (university_id, column_key, view_id, value)
                VALUES (?, ?, ?, ?)
                ON CONFLICT (university_id, column_key, view_id) 
                DO UPDATE SET value = EXCLUDED.value
            `, [uniId, 'uni_name', viewId, uni.name]);
            await dbRun(`
                INSERT INTO "values" (university_id, column_key, view_id, value)
                VALUES (?, ?, ?, ?)
                ON CONFLICT (university_id, column_key, view_id) 
                DO UPDATE SET value = EXCLUDED.value
            `, [uniId, 'cntr', viewId, uni.country]);
            await dbRun(`
                INSERT INTO "values" (university_id, column_key, view_id, value)
                VALUES (?, ?, ?, ?)
                ON CONFLICT (university_id, column_key, view_id) 
                DO UPDATE SET value = EXCLUDED.value
            `, [uniId, 'state', viewId, uni.state]);
            await dbRun(`
                INSERT INTO "values" (university_id, column_key, view_id, value)
                VALUES (?, ?, ?, ?)
                ON CONFLICT (university_id, column_key, view_id) 
                DO UPDATE SET value = EXCLUDED.value
            `, [uniId, 'city', viewId, uni.city]);
            await dbRun(`
                INSERT INTO "values" (university_id, column_key, view_id, value)
                VALUES (?, ?, ?, ?)
                ON CONFLICT (university_id, column_key, view_id) 
                DO UPDATE SET value = EXCLUDED.value
            `, [uniId, 'uni_type', viewId, uni.type]);
            await dbRun(`
                INSERT INTO "values" (university_id, column_key, view_id, value)
                VALUES (?, ?, ?, ?)
                ON CONFLICT (university_id, column_key, view_id) 
                DO UPDATE SET value = EXCLUDED.value
            `, [uniId, 'web', viewId, uni.website]);
        }
    }

    console.log('Database seeded successfully!');
}

