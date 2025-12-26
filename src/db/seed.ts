import { db, University } from './database';

const seedUniversities: Omit<University, 'id' | 'createdAt' | 'updatedAt'>[] = [
    { name: 'MIT', country: 'USA', state: 'Massachusetts', city: 'Cambridge', type: 'Private', website: 'https://www.mit.edu' },
    { name: 'Cambridge', country: 'UK', state: null, city: 'Cambridge', type: 'Public', website: 'https://www.cam.ac.uk' },
    { name: 'Oxford', country: 'UK', state: null, city: 'Oxford', type: 'Public', website: 'https://www.ox.ac.uk' },
    { name: 'Harvard', country: 'USA', state: 'Massachusetts', city: 'Cambridge', type: 'Private', website: 'https://www.harvard.edu' },
    { name: 'Stanford', country: 'USA', state: 'California', city: 'Stanford', type: 'Private', website: 'https://www.stanford.edu' },
    { name: 'Imperial College London', country: 'UK', state: null, city: 'London', type: 'Public', website: 'https://www.imperial.ac.uk' },
    { name: 'UCL', country: 'UK', state: null, city: 'London', type: 'Public', website: 'https://www.ucl.ac.uk' },
    { name: 'Caltech', country: 'USA', state: 'California', city: 'Pasadena', type: 'Private', website: 'https://www.caltech.edu' },
    { name: 'University of Chicago', country: 'USA', state: 'Illinois', city: 'Chicago', type: 'Private', website: 'https://www.uchicago.edu' },
    { name: 'University of Pennsylvania', country: 'USA', state: 'Pennsylvania', city: 'Philadelphia', type: 'Private', website: 'https://www.upenn.edu' },
    { name: 'Yale', country: 'USA', state: 'Connecticut', city: 'New Haven', type: 'Private', website: 'https://www.yale.edu' },
    { name: 'Columbia', country: 'USA', state: 'New York', city: 'New York', type: 'Private', website: 'https://www.columbia.edu' },
    { name: 'Princeton', country: 'USA', state: 'New Jersey', city: 'Princeton', type: 'Private', website: 'https://www.princeton.edu' },
    { name: 'Cornell', country: 'USA', state: 'New York', city: 'Ithaca', type: 'Private', website: 'https://www.cornell.edu' },
    { name: 'University of Edinburgh', country: 'UK', state: null, city: 'Edinburgh', type: 'Public', website: 'https://www.ed.ac.uk' },
    { name: 'Johns Hopkins', country: 'USA', state: 'Maryland', city: 'Baltimore', type: 'Private', website: 'https://www.jhu.edu' },
    { name: 'UC Berkeley', country: 'USA', state: 'California', city: 'Berkeley', type: 'Public', website: 'https://www.berkeley.edu' },
    { name: 'UCLA', country: 'USA', state: 'California', city: 'Los Angeles', type: 'Public', website: 'https://www.ucla.edu' },
    { name: 'University of Michigan', country: 'USA', state: 'Michigan', city: 'Ann Arbor', type: 'Public', website: 'https://www.umich.edu' },
    { name: 'Northwestern', country: 'USA', state: 'Illinois', city: 'Evanston', type: 'Private', website: 'https://www.northwestern.edu' },
    { name: "King's College London", country: 'UK', state: null, city: 'London', type: 'Public', website: 'https://www.kcl.ac.uk' },
    { name: 'LSE', country: 'UK', state: null, city: 'London', type: 'Public', website: 'https://www.lse.ac.uk' },
    { name: 'Duke', country: 'USA', state: 'North Carolina', city: 'Durham', type: 'Private', website: 'https://www.duke.edu' },
    { name: 'University of Washington', country: 'USA', state: 'Washington', city: 'Seattle', type: 'Public', website: 'https://www.washington.edu' },
    { name: 'University of Manchester', country: 'UK', state: null, city: 'Manchester', type: 'Public', website: 'https://www.manchester.ac.uk' },
    { name: 'Carnegie Mellon', country: 'USA', state: 'Pennsylvania', city: 'Pittsburgh', type: 'Private', website: 'https://www.cmu.edu' },
    { name: 'University of Bristol', country: 'UK', state: null, city: 'Bristol', type: 'Public', website: 'https://www.bristol.ac.uk' },
    { name: 'University of Warwick', country: 'UK', state: null, city: 'Coventry', type: 'Public', website: 'https://warwick.ac.uk' },
    { name: 'Brown', country: 'USA', state: 'Rhode Island', city: 'Providence', type: 'Private', website: 'https://www.brown.edu' },
    { name: 'NYU', country: 'USA', state: 'New York', city: 'New York', type: 'Private', website: 'https://www.nyu.edu' },
];

export async function seedDatabase() {
    try {
        // Wait for database to be ready
        await db.open();

        const count = await db.universities.count();
        if (count > 0) {
            console.log('Database already seeded, skipping...');
            return; // Already seeded
        }

        console.log('Seeding database...');
        const now = Date.now();
        const universities: University[] = seedUniversities.map(uni => ({
            ...uni,
            createdAt: now,
            updatedAt: now,
        }));

        await db.universities.bulkAdd(universities);
        console.log(`Added ${universities.length} universities`);

        // Create default columns
        const defaultColumns = [
            { key: 'name', label: 'Name', type: 'text' as const, section: 'Basics', pinned: true, visible: true, order: 0 },
            { key: 'country', label: 'Country', type: 'text' as const, section: 'Basics', pinned: true, visible: true, order: 1 },
            { key: 'city', label: 'City', type: 'text' as const, section: 'Basics', pinned: false, visible: true, order: 2 },
            { key: 'type', label: 'Type', type: 'select' as const, section: 'Basics', selectOptions: ['Public', 'Private'], pinned: false, visible: true, order: 3 },
            { key: 'website', label: 'Website', type: 'link' as const, section: 'Basics', pinned: false, visible: true, order: 4 },
        ];

        await db.columns.bulkAdd(
            defaultColumns.map((col) => ({
                ...col,
                createdAt: now,
            }))
        );
        console.log(`Added ${defaultColumns.length} default columns`);
        console.log('Database seeded successfully!');
    } catch (error) {
        console.error('Error seeding database:', error);
        throw error;
    }
}

