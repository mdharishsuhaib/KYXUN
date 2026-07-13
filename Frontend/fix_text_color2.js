const fs = require('fs');

let loginCode = fs.readFileSync('src/app/login/page.tsx', 'utf8');
loginCode = loginCode.replace('className="w-full py-3.5 rounded-xl font-bold kyxun-text bg-[var(--kyxun-accent)] transition-all mt-2 cursor-pointer disabled:opacity-70 hover:opacity-90"',
  'className="w-full py-3.5 rounded-xl font-bold text-slate-900 bg-[var(--kyxun-accent)] transition-all mt-2 cursor-pointer disabled:opacity-70 hover:opacity-90"');
fs.writeFileSync('src/app/login/page.tsx', loginCode);

let signupCode = fs.readFileSync('src/app/signup/page.tsx', 'utf8');
signupCode = signupCode.replace('className="w-full py-3.5 rounded-xl font-bold kyxun-text bg-[var(--kyxun-accent)] transition-all mt-2 cursor-pointer disabled:opacity-70 hover:opacity-90"',
  'className="w-full py-3.5 rounded-xl font-bold text-slate-900 bg-[var(--kyxun-accent)] transition-all mt-2 cursor-pointer disabled:opacity-70 hover:opacity-90"');
fs.writeFileSync('src/app/signup/page.tsx', signupCode);
