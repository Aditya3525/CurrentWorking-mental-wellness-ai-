// Script to find and list all hardcoded fetch('/api') calls
// Run this to see what needs to be fixed

import { execSync } from 'child_process';

try {
  const result = execSync(
    `grep -r "fetch\\('/api" frontend/src --include="*.tsx" --include="*.ts" -n`,
    { encoding: 'utf-8' }
  );
  console.log('Files with hardcoded API calls:\n');
  console.log(result);
} catch (error) {
  console.log('No more hardcoded fetch calls found!');
}
