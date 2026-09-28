export interface MissingField {
  field: string
  severity: 'blocking' | 'warning' | 'info'
  message: string
  default_value?: string
  quick_action?: 'dropdown' | 'toggle' | 'input'
  quick_action_options?: string[]
}

export function detectMissingFields(
  requirements: any,
  hasAH: boolean
): MissingField[] {
  const missing: MissingField[] = []

  if (!requirements) return missing

  // BLOCKING
  if (!requirements.mh_capacity) {
    missing.push({
      field: 'mh_capacity',
      severity: 'blocking',
      message: 'Main hoist capacity is required. Cannot calculate without this.',
      quick_action: 'input'
    })
  }

  if (!requirements.span) {
    missing.push({
      field: 'span',
      severity: 'blocking',
      message: 'Span (rail centre distance) is required for structural calculation.',
      quick_action: 'input'
    })
  }

  if (!requirements.mh_lift) {
    missing.push({
      field: 'mh_lift',
      severity: 'blocking',
      message: 'Main hoist lift height is required.',
      quick_action: 'input'
    })
  }

  if (!requirements.ct_speed) {
    missing.push({
      field: 'ct_speed',
      severity: 'blocking',
      message: 'Cross travel speed is required.',
      quick_action: 'input'
    })
  }

  if (!requirements.lt_speed) {
    missing.push({
      field: 'lt_speed',
      severity: 'blocking',
      message: 'Long travel speed is required.',
      quick_action: 'input'
    })
  }

  // WARNING (Assumed defaults)
  if (!requirements.duty_class) {
    missing.push({
      field: 'duty_class',
      severity: 'warning',
      message: 'Duty class not specified. Assumed M5 per IS:3177-1999.',
      default_value: 'M5',
      quick_action: 'dropdown',
      quick_action_options: ['M3', 'M4', 'M5', 'M6', 'M7', 'M8']
    })
  }

  if (!requirements.ambient_temp) {
    missing.push({
      field: 'ambient_temp',
      severity: 'warning',
      message: 'Ambient temperature not specified. Assumed 45°C.',
      default_value: '45',
      quick_action: 'input'
    })
  }

  if (!requirements.rail_size) {
    missing.push({
      field: 'rail_size',
      severity: 'warning',
      message: 'Rail size not specified. Will be determined by engineer.',
      quick_action: 'input'
    })
  }

  if (!requirements.power_supply) {
    missing.push({
      field: 'power_supply',
      severity: 'warning',
      message: 'Power supply assumed as 415V, 3Ph, 50Hz.',
      default_value: '415V 3Ph 50Hz',
      quick_action: 'input'
    })
  }

  // INFO (Optional fields)
  if (hasAH) {
    if (!requirements.ah_capacity) {
      missing.push({
        field: 'ah_capacity',
        severity: 'info',
        message: 'AH capacity not specified.',
        quick_action: 'input'
      })
    }
    if (!requirements.ah_lift) {
      missing.push({
        field: 'ah_lift',
        severity: 'info',
        message: 'AH lift height not specified.',
        quick_action: 'input'
      })
    }
  }

  if (requirements.vvvf_required === null || requirements.vvvf_required === undefined) {
    missing.push({
      field: 'vvvf_required',
      severity: 'info',
      message: 'VVVF requirement not specified. Assumed not required.',
      quick_action: 'toggle'
    })
  }

  if (!requirements.control_type) {
    missing.push({
      field: 'control_type',
      severity: 'info',
      message: 'Control type not specified.',
      quick_action: 'dropdown',
      quick_action_options: ['Pendant', 'Radio Remote', 'Cabin', 'Pendant + Radio Remote']
    })
  }

  return missing
}
