export const WASTE_TYPES = {
  reciclavel: {
    key: 'reciclavel',
    value: 'Material Reciclável',
    label: 'Reciclável',
    longLabel: 'Reciclável',
    hint: 'Plástico, metal e vidro',
    color: '#F2B130',
    bg: '#FDF2D9',
    fg: '#8A5D00',
  },
  papel: {
    key: 'papel',
    value: 'Papel Reciclável',
    label: 'Papel',
    longLabel: 'Papel reciclável',
    hint: 'Papel e papelão',
    color: '#3F72E0',
    bg: '#E6EEFD',
    fg: '#1D4AA6',
  },
  naoReciclavel: {
    key: 'naoReciclavel',
    value: 'Não Reciclável',
    label: 'Não reciclável',
    longLabel: 'Não reciclável',
    hint: 'Rejeitos e orgânicos',
    color: '#4B5563',
    bg: '#ECEEF1',
    fg: '#2E3640',
  },
}

export const WASTE_ORDER = ['reciclavel', 'papel', 'naoReciclavel']

export const BAG_SIZES = [1, 10, 20, 30, 40, 60, 80, 100]

export const wasteFromValue = (value = '') => {
  const v = value.toLowerCase()
  if (v.includes('papel')) return WASTE_TYPES.papel
  if (v.includes('não') || v.includes('nao')) return WASTE_TYPES.naoReciclavel
  return WASTE_TYPES.reciclavel
}
