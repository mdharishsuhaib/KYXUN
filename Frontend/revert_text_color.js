const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

code = code.replace(
  'className="px-9 py-5 rounded-2xl font-black text-xl text-slate-900 text-center transition-all hover:scale-[1.03] active:scale-[0.97] bg-[var(--kyxun-accent)]"',
  'className="px-9 py-5 rounded-2xl font-black text-xl text-white text-center transition-all hover:scale-[1.03] active:scale-[0.97] bg-[var(--kyxun-accent)]"'
);

code = code.replace(
  'className="w-full py-4 rounded-2xl font-black text-base text-slate-900 text-center transition-all hover:scale-[1.02] active:scale-[0.98] bg-[var(--kyxun-accent)]"',
  'className="w-full py-4 rounded-2xl font-black text-base text-white text-center transition-all hover:scale-[1.02] active:scale-[0.98] bg-[var(--kyxun-accent)]"'
);

code = code.replace(
  'className="hidden sm:flex px-4 py-2 rounded-lg text-sm font-medium text-slate-900 bg-[var(--kyxun-accent)] transition-transform hover:scale-105"',
  'className="hidden sm:flex px-4 py-2 rounded-lg text-sm font-medium text-white bg-[var(--kyxun-accent)] transition-transform hover:scale-105"'
);

code = code.replace(
  'className="w-full py-4 rounded-2xl font-black text-base text-slate-900 text-center bg-[var(--kyxun-accent)] transition-transform hover:scale-[1.02] active:scale-[0.98]"',
  'className="w-full py-4 rounded-2xl font-black text-base text-white text-center bg-[var(--kyxun-accent)] transition-transform hover:scale-[1.02] active:scale-[0.98]"'
);

fs.writeFileSync('src/app/page.tsx', code);

let loginCode = fs.readFileSync('src/app/login/page.tsx', 'utf8');
loginCode = loginCode.replace('className="w-full py-3.5 rounded-xl font-bold text-slate-900 bg-[var(--kyxun-accent)] transition-all mt-2 cursor-pointer disabled:opacity-70 hover:opacity-90"',
  'className="w-full py-3.5 rounded-xl font-bold text-white bg-[var(--kyxun-accent)] transition-all mt-2 cursor-pointer disabled:opacity-70 hover:opacity-90"');
fs.writeFileSync('src/app/login/page.tsx', loginCode);

let signupCode = fs.readFileSync('src/app/signup/page.tsx', 'utf8');
signupCode = signupCode.replace('className="w-full py-3.5 rounded-xl font-bold text-slate-900 bg-[var(--kyxun-accent)] transition-all mt-2 cursor-pointer disabled:opacity-70 hover:opacity-90"',
  'className="w-full py-3.5 rounded-xl font-bold text-white bg-[var(--kyxun-accent)] transition-all mt-2 cursor-pointer disabled:opacity-70 hover:opacity-90"');
fs.writeFileSync('src/app/signup/page.tsx', signupCode);
