import fs from 'fs';
let content = fs.readFileSync('contexts/ERPContext.tsx', 'utf-8');
content = content.replace(/fetch\('\/api\//g, "fetch(import.meta.env.VITE_API_BASE_URL + '/api/");
content = content.replace(/fetch\(\`\/api\//g, "fetch(import.meta.env.VITE_API_BASE_URL + `/api/");
content = content.replace(/import { UserRole } from '\.\.\/types';/g, "import { UserRole } from '../types';\n\nconst API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';");
// Need to make sure import.meta.env is replaced but better to assign it to API_BASE_URL
content = content.replace(/fetch\(import\.meta\.env\.VITE_API_BASE_URL \+ /g, "fetch(API_BASE_URL + ");
fs.writeFileSync('contexts/ERPContext.tsx', content);
