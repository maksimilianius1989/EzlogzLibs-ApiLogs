<?php
//user access
$roles = [];
$roles[TYPE_EZLOGZ_MANAGER] = ['new_devices', 'support', 'support_chats', 'dashboard', 'carriers', 'search_by_support', 'eld', 'eld_orders', 'eld_demo', 'all_poi', 'new_poi', 'edit_poi',
	'site_manage', 'day_report', 'ezchat', 'eld_buy_now_requests', 'account', 'eld_full_report', 'users', 'returns', 'cancelations',
	'tracking_map', 'calendar', 'support_client_tickets', 'price', 'support_faq', 'user_reviews_offers', 'finances', 'admin_finances_invoices', 'admin_finances_refunds',
	'paper_logs', 'eld_orders_report', 'eld_tariff_requests', 'cameraOrders', 'cameraSN', 'driverErrorEvents', 'smartSafetyUsers', 'camera', 'promo', 'users_backup', 'smart_safety_sales', 'find_malfunctions'];
$roles[TYPE_EMPLOYEE] = ['projectInfo', 'tasks', 'dashboard', 'day_report', 'ezchat', 'support', 'account', 'calendar', 'support_client_tickets', 'tasks_2', 'support_faq', 'project_modules', 'all_poi', 'new_poi', 'edit_poi', 'admin_finances_chart', 'eld_orders_report', 'scope'];

if (!defined('SAFE_MODE_HIDE')) {
    define('SAFE_MODE_HIDE', ['score_card', 'score_card_events', 'calendar', 'messages', 'ezchat']);
}
