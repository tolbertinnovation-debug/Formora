export const STORAGE_KEY = 'formora.workspace.v1';
export const TYPES = { text: 'Short answer', email: 'Email address', tel: 'Phone number', textarea: 'Long answer', select: 'Dropdown', date: 'Date', number: 'Number' };
export function uid() {
  if (globalThis.crypto.randomUUID) return globalThis.crypto.randomUUID();
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64; bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, b => b.toString(16).padStart(2,'0')).join('');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}
export function field(type = 'text', label = 'Untitled question', required = false) {
  return { id: uid(), type, label, required, options: type === 'select' ? ['Option 1', 'Option 2'] : [] };
}
export const TEMPLATES = [
  { id: 'training', name: 'Training registration', category: 'Education', icon: '↗', color: 'blue', description: 'Welcome new learners to your next course or workshop.', fields: [['text','Full name',true],['email','Email address',true],['tel','Phone number',false],['select','Preferred session',true,['Morning','Afternoon','Evening']]] },
  { id: 'event', name: 'Event registration', category: 'Events', icon: '◈', color: 'orange', description: 'Bring your community together, one registration at a time.', fields: [['text','Full name',true],['email','Email address',true],['select','Ticket type',true,['General admission','Student','Guest']],['textarea','Accessibility requirements',false]] },
  { id: 'feedback', name: 'Customer feedback', category: 'Business', icon: '✳', color: 'green', description: 'Listen to your customers and find your next improvement.', fields: [['text','Your name',false],['select','How was your experience?',true,['Excellent','Good','Fair','Poor']],['textarea','What could we improve?',true]] },
  { id: 'volunteer', name: 'Volunteer application', category: 'Community', icon: '♡', color: 'purple', description: 'Connect people who care with work that matters.', fields: [['text','Full name',true],['email','Email address',true],['textarea','Why would you like to volunteer?',true],['select','Availability',true,['Weekdays','Weekends','Flexible']]] },
  { id: 'inquiry', name: 'Service inquiry', category: 'Business', icon: '↗', color: 'green', description: 'Make the first conversation with a new client effortless.', fields: [['text','Full name',true],['email','Email address',true],['text','Organization',false],['textarea','Tell us about your project',true]] },
  { id: 'survey', name: 'Community survey', category: 'Community', icon: '◎', color: 'blue', description: 'Understand local priorities and hear more perspectives.', fields: [['text','Community or town',true],['select','Your main priority',true,['Education','Employment','Infrastructure','Other']],['textarea','What would you like to share?',false]] }
];
export function makeForm(templateId) {
  const template = TEMPLATES.find(t => t.id === templateId);
  return { id: uid(), title: template?.name || 'Untitled form', description: template?.description || 'We would love to hear from you. Please complete the form below.', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), color: '#174ce5', fields: template ? template.fields.map(([type,label,required,options]) => ({ ...field(type,label,required), ...(options ? {options: [...options]} : {}) })) : [field('text','Full name',true),field('email','Email address',true)], responses: [] };
}
export function validateAnswers(form, answers) {
  const errors = {};
  for (const f of form.fields) {
    const value = String(answers[f.id] ?? '').trim();
    if (f.required && !value) errors[f.id] = 'Please complete this question.';
    else if (value && f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) errors[f.id] = 'Enter a valid email address.';
    else if (value && f.type === 'select' && !f.options.includes(value)) errors[f.id] = 'Choose an available option.';
    else if (value && f.type === 'number' && !Number.isFinite(Number(value))) errors[f.id] = 'Enter a valid number.';
    else if (value.length > 10000) errors[f.id] = 'Use 10,000 characters or fewer.';
  }
  return errors;
}
export function addResponse(form, answers) {
  const errors = validateAnswers(form, answers);
  if (Object.keys(errors).length) return { errors };
  const clean = Object.fromEntries(form.fields.map(f => [f.id, String(answers[f.id] ?? '').trim()]));
  const response = { id: uid(), submittedAt: new Date().toISOString(), answers: clean };
  form.responses.push(response);
  return { response, errors: {} };
}
export function csv(form) {
  // Neutralize spreadsheet formulas in every cell, including creator-controlled labels.
  const cell = value => { let s = String(value ?? ''); if (/^[\s]*[=+@-]/.test(s)) s = "'" + s; return '"' + s.replaceAll('"','""') + '"'; };
  return '\uFEFF' + [['Response ID','Submitted at',...form.fields.map(f=>f.label)],...form.responses.map(r=>[r.id,r.submittedAt,...form.fields.map(f=>r.answers[f.id] || '')])].map(row=>row.map(cell).join(',')).join('\r\n');
}
export function validWorkspace(value) {
  const isId = id => typeof id === 'string' && /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(id);
  return Array.isArray(value) && value.every(f => f && isId(f.id) && typeof f.title === 'string' && typeof f.description === 'string' && /^#[\da-f]{6}$/i.test(f.color) && Array.isArray(f.fields) && f.fields.every(q=>q && isId(q.id) && Object.hasOwn(TYPES,q.type) && typeof q.label === 'string' && typeof q.required === 'boolean' && Array.isArray(q.options) && q.options.every(o=>typeof o==='string')) && Array.isArray(f.responses) && f.responses.every(r=>r && isId(r.id) && typeof r.submittedAt==='string' && r.answers && typeof r.answers==='object' && Object.values(r.answers).every(a=>typeof a==='string')));
}
