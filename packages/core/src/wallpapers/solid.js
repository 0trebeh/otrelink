export default {
  id: 'solid',
  label: 'Solid',
  fields: [{ key: 'color', type: 'color', label: 'Color', default: '#f3f3f1' }],
  css: (w, sel) => `${sel}{background:${w.color}}`,
};
