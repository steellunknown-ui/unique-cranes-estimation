INSERT INTO system_config (key, value, description) VALUES
('MARGIN_MULTIPLIER', '1.6', 'Applied to base cost to get selling price'),
('GST_RATE', '18', 'GST percentage applied on grand total'),
('PAINTING_FLAT', '25000', 'Painting and surface treatment flat cost in INR'),
('MISC_FLAT', '15000', 'Miscellaneous items flat cost in INR'),
('CRD_FLAT', '10000', 'CRD packing and forwarding flat cost in INR'),
('STRUCTURAL_RATE_PER_TON', '85000', 'Structural fabrication cost per ton in INR'),
('QUOTATION_VALIDITY_DAYS', '30', 'Number of days quotation is valid'),
('COMPANY_NAME', 'Unique Industrial Handlers Pvt. Ltd.', 'Company name for documents'),
('COMPANY_ADDRESS', 'Andheri, Mumbai', 'Company address for letterhead'),
('COMPANY_EMAIL', 'enquiry@uniquecranes.com', 'Company email for documents'),
('COMPANY_PHONE', '+91-XXXXXXXXXX', 'Company phone for documents'),
('TERMS_AND_CONDITIONS', 'Payment: 30% advance with order, 60% before dispatch, 10% after erection. Delivery: 16-20 weeks from date of order. Warranty: 12 months from date of commissioning. Price basis: Ex-works Nashik. Taxes: GST extra as applicable.', 'Standard T&C for quotations');

INSERT INTO drawing_config (parameter, value, unit, description) VALUES
('head_room_mm', '3300', 'mm', 'Minimum head room above rail top'),
('min_hook_approach_mh_mm', '1250', 'mm', 'Minimum MH hook approach from rail'),
('min_hook_approach_ah_mm', '1100', 'mm', 'Minimum AH hook approach from rail'),
('platform_width_mm', '750', 'mm', 'Maintenance platform width'),
('end_carriage_min_width_mm', '1000', 'mm', 'Minimum end carriage width'),
('buffer_size_mm', '400', 'mm', 'Standard buffer size'),
('girder_depth_factor', '0.055', 'ratio', 'Girder depth = span x this factor'),
('ct_wheel_base_factor', '0.25', 'ratio', 'CT wheel base = span x this factor'),
('lt_wheel_base_mm', '5900', 'mm', 'Standard LT wheel base');

INSERT INTO components (category, model, unit_price, unit, specs) VALUES
-- Motors
('MOTOR', 'VD 160M', 95000, 'piece', '{"power_kw": 11, "frame": "160M", "pole": 6, "rpm": 975}'),
('MOTOR', 'VD 180L', 145000, 'piece', '{"power_kw": 22, "frame": "180L", "pole": 6, "rpm": 975}'),
('MOTOR', 'VD 225M', 225000, 'piece', '{"power_kw": 37, "frame": "225M", "pole": 6, "rpm": 975}'),
('MOTOR', 'VD 250M', 310000, 'piece', '{"power_kw": 55, "frame": "250M", "pole": 6, "rpm": 975}'),
-- Brakes DCEM
('BRAKE_DCEM', 'DCEM 160', 18000, 'piece', '{"type": "DCEM", "frame": 160}'),
('BRAKE_DCEM', 'DCEM 200', 26000, 'piece', '{"type": "DCEM", "frame": 200}'),
('BRAKE_DCEM', 'DCEM 300', 42000, 'piece', '{"type": "DCEM", "frame": 300}'),
-- Brakes EHT
('BRAKE_EHT', 'EHT 200', 35000, 'piece', '{"type": "EHT", "frame": 200}'),
('BRAKE_EHT', 'EHT 300', 52000, 'piece', '{"type": "EHT", "frame": 300}'),
-- Gearboxes
('GEARBOX', 'HR 350', 85000, 'piece', '{"type": "HR", "size": 350}'),
('GEARBOX', 'HR 650', 145000, 'piece', '{"type": "HR", "size": 650}'),
('GEARBOX', 'HR 1700', 285000, 'piece', '{"type": "HR", "size": 1700}'),
('GEARBOX', 'VR 500', 195000, 'piece', '{"type": "VR", "size": 500}'),
-- Wire Rope (per meter)
('WIRE_ROPE', '18mm 6x36 FC', 285, 'meter', '{"dia_mm": 18, "construction": "6x36", "core": "FC"}'),
('WIRE_ROPE', '22mm 6x36 FC', 420, 'meter', '{"dia_mm": 22, "construction": "6x36", "core": "FC"}'),
('WIRE_ROPE', '26mm 6x36 FC', 580, 'meter', '{"dia_mm": 26, "construction": "6x36", "core": "FC"}'),
-- Wheels
('WHEEL', 'Wheel 400mm CR80', 22000, 'piece', '{"dia_mm": 400, "rail": "CR80", "material": "C55Mn75"}'),
('WHEEL', 'Wheel 500mm CR100', 32000, 'piece', '{"dia_mm": 500, "rail": "CR100", "material": "C55Mn75"}');

INSERT INTO formulas (name, expression, variables, description) VALUES
('MH_ROPE_LENGTH', '(mh_lift * falls) + (span / 2) + 15', '["mh_lift", "falls", "span"]', 'Total wire rope length for main hoist in metres'),
('AH_ROPE_LENGTH', '(ah_lift * ah_falls) + (span / 2) + 10', '["ah_lift", "ah_falls", "span"]', 'Total wire rope length for aux hoist in metres'),
('STRUCTURAL_WEIGHT_TONS', '(span * mh_capacity * 0.045) + (span * 1.2)', '["span", "mh_capacity"]', 'Estimated structural weight in tons'),
('STRUCTURAL_COST', 'structural_weight * structural_rate_per_ton', '["structural_weight", "structural_rate_per_ton"]', 'Total structural fabrication cost'),
('MH_FALLS', 'FLOOR(mh_capacity / 8)', '["mh_capacity"]', 'Number of falls for main hoist rope reeving'),
('GRAND_TOTAL', '(mh_total + ah_total + ct_total + lt_total + structural_cost) * margin + painting + misc + crd', '["mh_total","ah_total","ct_total","lt_total","structural_cost","margin","painting","misc","crd"]', 'Final grand total before GST');
