// Load skill first: lucid_load_script_documentation(name="lucidcards") — only the LAST loaded optional skill is usable per script.
const K = skills.lucidcards;
const list = await K.list(); // [{id,title,status,assignee,boundingBox,isIntegrationBacked}]
const full = await Promise.all(list.map((c) => K.read(c.id))); // + endTime, description, fields[] (label "Source Meeting")
return full.map((c) => ({ id: c.id, title: c.title, status: c.status, assignee: c.assignee, due: c.endTime, bb: c.boundingBox,
  source: (c.fields.find((f) => f.label === "Source Meeting") || {}).displayValue }));
// Statuses: New, To Do, In Progress, Done, Not Doing, Blocked. Open = not Done / Not Doing.
