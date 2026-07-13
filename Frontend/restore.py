import sys

with open('diff_output.txt', 'r', encoding='utf-8') as f:
    diff_lines = f.readlines()

deleted_content = []
for line in diff_lines:
    if line.startswith('-'):
        deleted_content.append(line[1:]) # remove the minus sign
    elif line.startswith(' '):
        pass

with open(r'src\app\page.tsx', 'r', encoding='utf-8') as f:
    page_lines = f.readlines()

# The diff started at line 103 (index 102). We just need to re-insert the deleted content at index 102.
new_page_lines = page_lines[:102] + deleted_content + page_lines[102:]

# Now apply the replacements the user wanted!
for i in range(len(new_page_lines)):
    if 'className="hidden sm:flex px-4 py-2 rounded-lg text-sm font-medium text-white bg-[var(--kyxun-accent)] transition-transform hover:scale-105"' in new_page_lines[i]:
        new_page_lines[i] = new_page_lines[i].replace('bg-[var(--kyxun-accent)]', 'bg-[#65A30D]')
    elif 'className="px-9 py-5 rounded-2xl font-black text-xl text-white text-center transition-all hover:scale-[1.03] active:scale-[0.97] bg-[var(--kyxun-accent)]"' in new_page_lines[i]:
        new_page_lines[i] = new_page_lines[i].replace('bg-[var(--kyxun-accent)]', 'bg-[#65A30D]')
    elif 'className="w-full py-4 rounded-2xl font-black text-base text-white text-center bg-[var(--kyxun-accent)] transition-transform hover:scale-[1.02] active:scale-[0.98]"' in new_page_lines[i]:
        new_page_lines[i] = new_page_lines[i].replace('bg-[var(--kyxun-accent)]', 'bg-[#65A30D]')
    elif 'className="w-full py-4 rounded-2xl font-black text-base text-white text-center transition-all hover:scale-[1.02] active:scale-[0.98] bg-[var(--kyxun-accent)]"' in new_page_lines[i]:
        new_page_lines[i] = new_page_lines[i].replace('bg-[var(--kyxun-accent)]', 'bg-[#65A30D]')

with open(r'src\app\page.tsx', 'w', encoding='utf-8') as f:
    f.writelines(new_page_lines)

print(f'Restored {len(deleted_content)} lines and applied bg replacements.')
