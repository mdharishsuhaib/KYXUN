const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

code = code.replace(
  'className="px-9 py-5 rounded-2xl font-black text-xl kyxun-text text-center transition-all hover:scale-[1.03] active:scale-[0.97] bg-[var(--kyxun-accent)]"',
  'className="px-9 py-5 rounded-2xl font-black text-xl text-slate-900 text-center transition-all hover:scale-[1.03] active:scale-[0.97] bg-[var(--kyxun-accent)]"'
);

code = code.replace(
  'className="w-full py-4 rounded-2xl font-black text-base kyxun-text text-center transition-all hover:scale-[1.02] active:scale-[0.98] bg-[var(--kyxun-accent)]"',
  'className="w-full py-4 rounded-2xl font-black text-base text-slate-900 text-center transition-all hover:scale-[1.02] active:scale-[0.98] bg-[var(--kyxun-accent)]"'
);

code = code.replace(
  'className="hidden sm:flex px-4 py-2 rounded-lg text-sm font-medium kyxun-text bg-[var(--kyxun-accent)] transition-transform hover:scale-105"',
  'className="hidden sm:flex px-4 py-2 rounded-lg text-sm font-medium text-slate-900 bg-[var(--kyxun-accent)] transition-transform hover:scale-105"'
);

code = code.replace(
  'className="w-full py-4 rounded-2xl font-black text-base kyxun-text text-center bg-[var(--kyxun-accent)] transition-transform hover:scale-[1.02] active:scale-[0.98]"',
  'className="w-full py-4 rounded-2xl font-black text-base text-slate-900 text-center bg-[var(--kyxun-accent)] transition-transform hover:scale-[1.02] active:scale-[0.98]"'
);

fs.writeFileSync('src/app/page.tsx', code);
