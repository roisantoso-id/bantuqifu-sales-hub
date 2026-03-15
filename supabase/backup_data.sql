SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict gu68wV3sedZOHId9gQkgTqTXydjBHyFWnVVYz4KbKFcCPsTq4wgLTxFDUnsK6MV

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: custom_oauth_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES
	('00000000-0000-0000-0000-000000000000', 'debf13e8-3a82-421b-bd87-6223ec60f0d3', 'authenticated', 'authenticated', 'admin@bantuqifu.com', '$2a$06$X2heacRPhaAVRuxXTOGidunaC9zKld35XgiveXxdiTta6Oi8hIN.O', '2026-03-14 19:35:13.038825+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-03-15 15:31:06.079655+00', '{"provider": "email", "providers": ["email"]}', '{"name": "系统管理员"}', NULL, '2026-03-14 19:35:13.038825+00', '2026-03-15 17:30:05.869565+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001', NULL, 'authenticated', 'system@bantuqifu.com', '$2a$06$z0.Z7ZsyLsO7xeKDNn8nWeo/AOlHh85.FoBVn2zvmKvABIu6mz9XS', '2026-03-15 04:48:13.745186+00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{"provider": "system", "providers": ["system"]}', '{"name": "Bantu System (系统自动执行)"}', false, '2026-03-15 04:48:13.745186+00', '2026-03-15 04:48:13.745186+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."sessions" ("id", "user_id", "created_at", "updated_at", "factor_id", "aal", "not_after", "refreshed_at", "user_agent", "ip", "tag", "oauth_client_id", "refresh_token_hmac_key", "refresh_token_counter", "scopes") VALUES
	('19813e18-138a-49ae-abaa-b678946718b0', 'debf13e8-3a82-421b-bd87-6223ec60f0d3', '2026-03-14 19:49:33.618789+00', '2026-03-14 19:49:33.618789+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '156.230.182.72', NULL, NULL, NULL, NULL, NULL),
	('8b6a375f-2539-43eb-93bc-4625f8e0ec93', 'debf13e8-3a82-421b-bd87-6223ec60f0d3', '2026-03-14 19:49:48.847097+00', '2026-03-14 19:49:48.847097+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '156.230.182.72', NULL, NULL, NULL, NULL, NULL),
	('ee272948-227f-4a13-8a0c-773bbd2aa4d2', 'debf13e8-3a82-421b-bd87-6223ec60f0d3', '2026-03-14 20:38:56.786154+00', '2026-03-14 20:38:56.786154+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '156.230.182.72', NULL, NULL, NULL, NULL, NULL),
	('fb2e090b-4cf2-48c6-97a7-c1e58f4b21f6', 'debf13e8-3a82-421b-bd87-6223ec60f0d3', '2026-03-14 20:41:01.052477+00', '2026-03-14 20:41:01.052477+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '156.230.182.72', NULL, NULL, NULL, NULL, NULL),
	('0aecfc1a-3ee8-4909-a1d9-45fc938b7f40', 'debf13e8-3a82-421b-bd87-6223ec60f0d3', '2026-03-14 21:19:28.330191+00', '2026-03-14 21:19:28.330191+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '156.230.182.72', NULL, NULL, NULL, NULL, NULL),
	('41dc6e8c-a413-46c3-83f6-0ba89699321f', 'debf13e8-3a82-421b-bd87-6223ec60f0d3', '2026-03-15 03:45:25.773159+00', '2026-03-15 03:45:25.773159+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '156.230.182.72', NULL, NULL, NULL, NULL, NULL),
	('29f4a3ef-129c-4fff-bf2b-055bd095ae95', 'debf13e8-3a82-421b-bd87-6223ec60f0d3', '2026-03-15 04:26:07.697654+00', '2026-03-15 04:26:07.697654+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '156.230.182.72', NULL, NULL, NULL, NULL, NULL),
	('81cd1a2c-8e82-4425-a5d5-8889285e538d', 'debf13e8-3a82-421b-bd87-6223ec60f0d3', '2026-03-15 04:51:30.103572+00', '2026-03-15 04:51:30.103572+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '156.230.182.72', NULL, NULL, NULL, NULL, NULL),
	('d82f68a5-a569-4905-8485-815b52654620', 'debf13e8-3a82-421b-bd87-6223ec60f0d3', '2026-03-15 04:51:37.144795+00', '2026-03-15 04:51:37.144795+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '156.230.182.72', NULL, NULL, NULL, NULL, NULL),
	('3e96b663-094a-4dd0-b2d7-a2fbb380ac75', 'debf13e8-3a82-421b-bd87-6223ec60f0d3', '2026-03-15 06:22:04.893358+00', '2026-03-15 06:22:04.893358+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36 NetType/WIFI MicroMessenger/7.0.20.1781(0x6700143B) MacWechat/3.8.7(0x13080712) UnifiedPCMacWechat(0xf2641733) XWEB/18888 Flue', '103.126.31.147', NULL, NULL, NULL, NULL, NULL),
	('04e2db86-736f-4826-b2ee-48ebbbf26b4e', 'debf13e8-3a82-421b-bd87-6223ec60f0d3', '2026-03-15 06:18:38.290961+00', '2026-03-15 07:17:41.39744+00', NULL, 'aal1', NULL, '2026-03-15 07:17:41.39735', 'Next.js Middleware', '147.139.195.214', NULL, NULL, NULL, NULL, NULL),
	('ee3cf9af-b6b2-4230-8bdd-2112717b795c', 'debf13e8-3a82-421b-bd87-6223ec60f0d3', '2026-03-15 05:40:47.231552+00', '2026-03-15 07:54:34.001686+00', NULL, 'aal1', NULL, '2026-03-15 07:54:34.001594', 'Next.js Middleware', '147.139.195.214', NULL, NULL, NULL, NULL, NULL),
	('0b8a0550-321f-4657-8872-f59beb3192e5', 'debf13e8-3a82-421b-bd87-6223ec60f0d3', '2026-03-15 07:41:51.170431+00', '2026-03-15 13:53:51.56717+00', NULL, 'aal1', NULL, '2026-03-15 13:53:51.567074', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '156.230.182.72', NULL, NULL, NULL, NULL, NULL),
	('1fc6ac52-d778-42b5-b788-31e7a1b9dc21', 'debf13e8-3a82-421b-bd87-6223ec60f0d3', '2026-03-15 03:57:35.040504+00', '2026-03-15 14:55:48.585067+00', NULL, 'aal1', NULL, '2026-03-15 14:55:48.582862', 'Next.js Middleware', '147.139.195.214', NULL, NULL, NULL, NULL, NULL),
	('dec83244-2aa4-4974-a8a7-1b95cc3e5b46', 'debf13e8-3a82-421b-bd87-6223ec60f0d3', '2026-03-15 15:18:47.183858+00', '2026-03-15 15:18:47.183858+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '156.230.182.72', NULL, NULL, NULL, NULL, NULL),
	('3e4f81a3-d0ea-424a-814a-c60fa2a9a3ed', 'debf13e8-3a82-421b-bd87-6223ec60f0d3', '2026-03-15 15:31:06.080143+00', '2026-03-15 17:30:05.874797+00', NULL, 'aal1', NULL, '2026-03-15 17:30:05.8747', 'Next.js Middleware', '147.139.195.214', NULL, NULL, NULL, NULL, NULL);


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."mfa_amr_claims" ("session_id", "created_at", "updated_at", "authentication_method", "id") VALUES
	('19813e18-138a-49ae-abaa-b678946718b0', '2026-03-14 19:49:33.658891+00', '2026-03-14 19:49:33.658891+00', 'password', 'cd899c4d-1b50-404f-a096-9b510dc62785'),
	('8b6a375f-2539-43eb-93bc-4625f8e0ec93', '2026-03-14 19:49:48.856637+00', '2026-03-14 19:49:48.856637+00', 'password', '962405b0-16d6-4d2f-8b40-f6be21144935'),
	('ee272948-227f-4a13-8a0c-773bbd2aa4d2', '2026-03-14 20:38:56.836175+00', '2026-03-14 20:38:56.836175+00', 'password', 'f1e12f91-0efd-4f93-b93d-16e703611be1'),
	('fb2e090b-4cf2-48c6-97a7-c1e58f4b21f6', '2026-03-14 20:41:01.070385+00', '2026-03-14 20:41:01.070385+00', 'password', 'ba35d134-a3aa-4077-9cb9-c63e4fd68e56'),
	('0aecfc1a-3ee8-4909-a1d9-45fc938b7f40', '2026-03-14 21:19:28.360341+00', '2026-03-14 21:19:28.360341+00', 'password', 'da6dd30a-4e89-4cff-a648-e1c8e8d5d3be'),
	('41dc6e8c-a413-46c3-83f6-0ba89699321f', '2026-03-15 03:45:25.823782+00', '2026-03-15 03:45:25.823782+00', 'password', '81b13a5c-f3a3-4b2a-bdc4-1e2be62d8979'),
	('1fc6ac52-d778-42b5-b788-31e7a1b9dc21', '2026-03-15 03:57:35.067961+00', '2026-03-15 03:57:35.067961+00', 'password', '8c4fcf64-4550-4e1e-8444-f65300ad4e60'),
	('29f4a3ef-129c-4fff-bf2b-055bd095ae95', '2026-03-15 04:26:07.71548+00', '2026-03-15 04:26:07.71548+00', 'password', '8deb54f4-17e1-46f4-a28a-d571244094d3'),
	('81cd1a2c-8e82-4425-a5d5-8889285e538d', '2026-03-15 04:51:30.140171+00', '2026-03-15 04:51:30.140171+00', 'password', '3ca03189-0ba7-413c-a45f-991893e0bccd'),
	('d82f68a5-a569-4905-8485-815b52654620', '2026-03-15 04:51:37.149877+00', '2026-03-15 04:51:37.149877+00', 'password', 'f2a0761f-c85b-4bb0-81ae-0f8ff199d762'),
	('ee3cf9af-b6b2-4230-8bdd-2112717b795c', '2026-03-15 05:40:47.256386+00', '2026-03-15 05:40:47.256386+00', 'password', 'c2c50a29-1aec-4714-a10e-7edc26d5ee7a'),
	('04e2db86-736f-4826-b2ee-48ebbbf26b4e', '2026-03-15 06:18:38.340487+00', '2026-03-15 06:18:38.340487+00', 'password', 'afd1baee-4709-478a-9907-3a9aba0e177c'),
	('3e96b663-094a-4dd0-b2d7-a2fbb380ac75', '2026-03-15 06:22:04.928846+00', '2026-03-15 06:22:04.928846+00', 'password', '9b3dfcce-5345-4cad-991b-e5c01ed1a1f6'),
	('0b8a0550-321f-4657-8872-f59beb3192e5', '2026-03-15 07:41:51.216956+00', '2026-03-15 07:41:51.216956+00', 'password', 'bebd7142-644f-417a-954b-905c7cebc2d1'),
	('dec83244-2aa4-4974-a8a7-1b95cc3e5b46', '2026-03-15 15:18:47.20597+00', '2026-03-15 15:18:47.20597+00', 'password', '88f3d40f-c689-4fca-bb11-a8c4e3e5ab07'),
	('3e4f81a3-d0ea-424a-814a-c60fa2a9a3ed', '2026-03-15 15:31:06.130052+00', '2026-03-15 15:31:06.130052+00', 'password', 'e42cd44c-5765-4202-ba29-d8873b384e03');


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."refresh_tokens" ("instance_id", "id", "token", "user_id", "revoked", "created_at", "updated_at", "parent", "session_id") VALUES
	('00000000-0000-0000-0000-000000000000', 1, 'unthuz4h4j42', 'debf13e8-3a82-421b-bd87-6223ec60f0d3', false, '2026-03-14 19:49:33.641136+00', '2026-03-14 19:49:33.641136+00', NULL, '19813e18-138a-49ae-abaa-b678946718b0'),
	('00000000-0000-0000-0000-000000000000', 2, 'e2guqx5thsjp', 'debf13e8-3a82-421b-bd87-6223ec60f0d3', false, '2026-03-14 19:49:48.84943+00', '2026-03-14 19:49:48.84943+00', NULL, '8b6a375f-2539-43eb-93bc-4625f8e0ec93'),
	('00000000-0000-0000-0000-000000000000', 3, 'gsyx4xg36ade', 'debf13e8-3a82-421b-bd87-6223ec60f0d3', false, '2026-03-14 20:38:56.814895+00', '2026-03-14 20:38:56.814895+00', NULL, 'ee272948-227f-4a13-8a0c-773bbd2aa4d2'),
	('00000000-0000-0000-0000-000000000000', 4, '6f4gsruwqwcs', 'debf13e8-3a82-421b-bd87-6223ec60f0d3', false, '2026-03-14 20:41:01.06511+00', '2026-03-14 20:41:01.06511+00', NULL, 'fb2e090b-4cf2-48c6-97a7-c1e58f4b21f6'),
	('00000000-0000-0000-0000-000000000000', 5, 'm2m3vzjkup3h', 'debf13e8-3a82-421b-bd87-6223ec60f0d3', false, '2026-03-14 21:19:28.34993+00', '2026-03-14 21:19:28.34993+00', NULL, '0aecfc1a-3ee8-4909-a1d9-45fc938b7f40'),
	('00000000-0000-0000-0000-000000000000', 6, 'w6alxsvsh5s7', 'debf13e8-3a82-421b-bd87-6223ec60f0d3', false, '2026-03-15 03:45:25.805838+00', '2026-03-15 03:45:25.805838+00', NULL, '41dc6e8c-a413-46c3-83f6-0ba89699321f'),
	('00000000-0000-0000-0000-000000000000', 8, 'hakhhfellrh3', 'debf13e8-3a82-421b-bd87-6223ec60f0d3', false, '2026-03-15 04:26:07.707451+00', '2026-03-15 04:26:07.707451+00', NULL, '29f4a3ef-129c-4fff-bf2b-055bd095ae95'),
	('00000000-0000-0000-0000-000000000000', 9, 'gsfbgngjdenm', 'debf13e8-3a82-421b-bd87-6223ec60f0d3', false, '2026-03-15 04:51:30.122729+00', '2026-03-15 04:51:30.122729+00', NULL, '81cd1a2c-8e82-4425-a5d5-8889285e538d'),
	('00000000-0000-0000-0000-000000000000', 10, 'iogmqkgsuvpw', 'debf13e8-3a82-421b-bd87-6223ec60f0d3', false, '2026-03-15 04:51:37.148123+00', '2026-03-15 04:51:37.148123+00', NULL, 'd82f68a5-a569-4905-8485-815b52654620'),
	('00000000-0000-0000-0000-000000000000', 13, 'bzh5mm6qb6m2', 'debf13e8-3a82-421b-bd87-6223ec60f0d3', false, '2026-03-15 06:22:04.919292+00', '2026-03-15 06:22:04.919292+00', NULL, '3e96b663-094a-4dd0-b2d7-a2fbb380ac75'),
	('00000000-0000-0000-0000-000000000000', 11, 'dbua7jvulqxv', 'debf13e8-3a82-421b-bd87-6223ec60f0d3', true, '2026-03-15 05:40:47.24722+00', '2026-03-15 06:39:17.123255+00', NULL, 'ee3cf9af-b6b2-4230-8bdd-2112717b795c'),
	('00000000-0000-0000-0000-000000000000', 12, 'nkjhgnnr6d2k', 'debf13e8-3a82-421b-bd87-6223ec60f0d3', true, '2026-03-15 06:18:38.316072+00', '2026-03-15 07:17:41.382411+00', NULL, '04e2db86-736f-4826-b2ee-48ebbbf26b4e'),
	('00000000-0000-0000-0000-000000000000', 15, 'oyd2dfiylsng', 'debf13e8-3a82-421b-bd87-6223ec60f0d3', false, '2026-03-15 07:17:41.392255+00', '2026-03-15 07:17:41.392255+00', 'nkjhgnnr6d2k', '04e2db86-736f-4826-b2ee-48ebbbf26b4e'),
	('00000000-0000-0000-0000-000000000000', 14, 'tfibdiqssrki', 'debf13e8-3a82-421b-bd87-6223ec60f0d3', true, '2026-03-15 06:39:17.130807+00', '2026-03-15 07:54:33.971343+00', 'dbua7jvulqxv', 'ee3cf9af-b6b2-4230-8bdd-2112717b795c'),
	('00000000-0000-0000-0000-000000000000', 17, '662d5wdd6gor', 'debf13e8-3a82-421b-bd87-6223ec60f0d3', false, '2026-03-15 07:54:33.986891+00', '2026-03-15 07:54:33.986891+00', 'tfibdiqssrki', 'ee3cf9af-b6b2-4230-8bdd-2112717b795c'),
	('00000000-0000-0000-0000-000000000000', 16, 'ugfdt3clekc5', 'debf13e8-3a82-421b-bd87-6223ec60f0d3', true, '2026-03-15 07:41:51.18871+00', '2026-03-15 13:53:51.54164+00', NULL, '0b8a0550-321f-4657-8872-f59beb3192e5'),
	('00000000-0000-0000-0000-000000000000', 18, 'e366r2bu52d6', 'debf13e8-3a82-421b-bd87-6223ec60f0d3', false, '2026-03-15 13:53:51.55567+00', '2026-03-15 13:53:51.55567+00', 'ugfdt3clekc5', '0b8a0550-321f-4657-8872-f59beb3192e5'),
	('00000000-0000-0000-0000-000000000000', 7, 'rcr4ixepdo5l', 'debf13e8-3a82-421b-bd87-6223ec60f0d3', true, '2026-03-15 03:57:35.056868+00', '2026-03-15 13:55:47.244313+00', NULL, '1fc6ac52-d778-42b5-b788-31e7a1b9dc21'),
	('00000000-0000-0000-0000-000000000000', 19, 'ltvwtxxomd4s', 'debf13e8-3a82-421b-bd87-6223ec60f0d3', true, '2026-03-15 13:55:47.246501+00', '2026-03-15 14:55:48.529412+00', 'rcr4ixepdo5l', '1fc6ac52-d778-42b5-b788-31e7a1b9dc21'),
	('00000000-0000-0000-0000-000000000000', 20, 'e6a4ie3koari', 'debf13e8-3a82-421b-bd87-6223ec60f0d3', false, '2026-03-15 14:55:48.542791+00', '2026-03-15 14:55:48.542791+00', 'ltvwtxxomd4s', '1fc6ac52-d778-42b5-b788-31e7a1b9dc21'),
	('00000000-0000-0000-0000-000000000000', 21, 'oonvxdlnkn32', 'debf13e8-3a82-421b-bd87-6223ec60f0d3', false, '2026-03-15 15:18:47.193561+00', '2026-03-15 15:18:47.193561+00', NULL, 'dec83244-2aa4-4974-a8a7-1b95cc3e5b46'),
	('00000000-0000-0000-0000-000000000000', 22, '4koc3uxbobqq', 'debf13e8-3a82-421b-bd87-6223ec60f0d3', true, '2026-03-15 15:31:06.105301+00', '2026-03-15 16:29:40.461417+00', NULL, '3e4f81a3-d0ea-424a-814a-c60fa2a9a3ed'),
	('00000000-0000-0000-0000-000000000000', 23, 'f5icsggd6fng', 'debf13e8-3a82-421b-bd87-6223ec60f0d3', true, '2026-03-15 16:29:40.472586+00', '2026-03-15 17:30:05.846468+00', '4koc3uxbobqq', '3e4f81a3-d0ea-424a-814a-c60fa2a9a3ed'),
	('00000000-0000-0000-0000-000000000000', 24, 'gp4nh6re4hnb', 'debf13e8-3a82-421b-bd87-6223ec60f0d3', false, '2026-03-15 17:30:05.860884+00', '2026-03-15 17:30:05.860884+00', 'f5icsggd6fng', '3e4f81a3-d0ea-424a-814a-c60fa2a9a3ed');


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: dict_customer_levels; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: dict_industries; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: organizations; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."organizations" ("id", "code", "name", "site", "createdAt", "updatedAt") VALUES
	('org_bantu_id', 'BANTU_ID', '班兔印尼 Site', 'ID', '2026-03-15 15:15:35.616', '2026-03-15 15:15:35.616'),
	('org_bantu_cn', 'BANTU_CN', '班兔中国 Site', 'CN', '2026-03-15 15:15:35.616', '2026-03-15 15:15:35.616');


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."customers" ("id", "organizationId", "customerId", "customerName", "passportNo", "phone", "email", "wechat", "level", "levelDictId", "industryId", "isLocked", "createdAt", "updatedAt") VALUES
	('560749ee-244f-4769-8cae-78a80f032418', 'org_bantu_id', 'CUS-260315-0001', '极兔物流-总办', NULL, '+62-21-12345678', 'jtexpress@example.com', NULL, 'L4', NULL, NULL, false, '2026-03-15 15:16:49.701', '2026-03-15 15:16:49.701'),
	('e7e23c1b-75ef-4ce6-b14b-9abfe302e79a', 'org_bantu_id', 'CUS-260315-0002', '青山矿业-苏拉威西项目', NULL, '+62-21-23456789', NULL, NULL, 'L3', NULL, NULL, false, '2026-03-15 15:16:49.701', '2026-03-15 15:16:49.701'),
	('951f85fe-6109-438d-acd8-92debc28435a', 'org_bantu_id', 'CUS-260315-0003', '华为印尼-人力资源部', NULL, NULL, 'hr@huawei-id.com', NULL, 'L3', NULL, NULL, false, '2026-03-15 15:16:49.701', '2026-03-15 15:16:49.701');


--
-- Data for Name: users_auth; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."users_auth" ("id", "email", "name", "isActive", "createdAt", "updatedAt") VALUES
	('debf13e8-3a82-421b-bd87-6223ec60f0d3', 'admin@bantuqifu.com', '系统管理员', true, '2026-03-15 15:15:35.616', '2026-03-15 15:15:35.616');


--
-- Data for Name: leads; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."leads" ("id", "organizationId", "leadCode", "wechatName", "phone", "source", "category", "budgetMin", "budgetMax", "budgetCurrency", "urgency", "initialIntent", "assigneeId", "nextFollowDate", "lastActionAt", "status", "discardedAt", "discardReason", "discardedById", "createdAt", "updatedAt", "notes", "convertedOpportunityId", "assignedToId", "updatedById", "createdById", "customerId", "wechatGroupId", "wechatGroupName") VALUES
	('a1f8e687-873b-499f-a1d0-0927f5ab5338', 'org_bantu_id', 'LEAD-260315-0001', '王总-山海图贸易王总', '+86-138-0013-8001', 'wechat', 'VISA', 5000, 10000, 'CNY', 'HIGH', '想办 B1 签证，自雇商人啊', 'debf13e8-3a82-421b-bd87-6223ec60f0d3', NULL, '2026-03-15 16:23:49.382', 'converted', '2026-03-15 16:26:26.17', 'RETURN_TO_POOL', 'debf13e8-3a82-421b-bd87-6223ec60f0d3', '2026-03-15 15:17:11.529', '2026-03-15 16:41:48.199', '客户来自微信群', 'OPP-260315-2445', 'debf13e8-3a82-421b-bd87-6223ec60f0d3', 'debf13e8-3a82-421b-bd87-6223ec60f0d3', NULL, NULL, NULL, NULL),
	('8ca39950-5eb0-4a98-bb39-8b874f100bda', 'org_bantu_id', 'LEAD-260315-0002', '李经理-深圳科技', '+86-138-0013-8001', 'referral', 'COMPANY_REGISTRATION', 50000, 100000, 'CNY', 'MEDIUM', '想在印尼注册PMA公司', 'debf13e8-3a82-421b-bd87-6223ec60f0d3', NULL, NULL, 'converted', '2026-03-15 16:29:21.182', 'RETURN_TO_POOL', 'debf13e8-3a82-421b-bd87-6223ec60f0d3', '2026-03-15 15:17:11.529', '2026-03-15 16:58:41.222', NULL, 'OPP-260315-7291', NULL, 'debf13e8-3a82-421b-bd87-6223ec60f0d3', NULL, NULL, 20261230, '企业微信');


--
-- Data for Name: opportunities; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."opportunities" ("id", "organizationId", "opportunityCode", "customerId", "stageId", "status", "serviceType", "serviceTypeLabel", "estimatedAmount", "currency", "requirements", "notes", "destination", "travelDate", "assigneeId", "wechatGroupId", "wechatGroupName", "pinnedByUsers", "expectedCloseDate", "actualCloseDate", "createdAt", "updatedAt", "convertedFromLeadId") VALUES
	('OPP-260315-0001', 'org_bantu_id', 'OPP-260315-0001', '560749ee-244f-4769-8cae-78a80f032418', 'P1', 'active', 'VISA', '签证服务', 15000000, 'IDR', '需要办理10个B1签证', NULL, NULL, NULL, 'debf13e8-3a82-421b-bd87-6223ec60f0d3', 2026010, '极兔物流签证项目', '{}', NULL, NULL, '2026-03-15 15:17:11.529', '2026-03-15 15:17:11.529', NULL),
	('OPP-260315-0002', 'org_bantu_id', 'OPP-260315-0002', 'e7e23c1b-75ef-4ce6-b14b-9abfe302e79a', 'P2', 'active', 'COMPANY_REGISTRATION', '公司注册', 25000000, 'IDR', '注册PMA公司，矿业相关', NULL, NULL, NULL, 'debf13e8-3a82-421b-bd87-6223ec60f0d3', 2026011, '青山矿业公司注册', '{}', NULL, NULL, '2026-03-15 15:17:11.529', '2026-03-15 15:17:11.529', NULL),
	('OPP-260315-0003', 'org_bantu_id', 'OPP-260315-0003', '951f85fe-6109-438d-acd8-92debc28435a', 'P3', 'active', 'IMMIGRATION', '移民服务', 50000000, 'IDR', '批量办理工作签证', NULL, NULL, NULL, 'debf13e8-3a82-421b-bd87-6223ec60f0d3', 2026012, '华为工签批量办理', '{}', NULL, NULL, '2026-03-15 15:17:11.529', '2026-03-15 15:17:11.529', NULL),
	('OPP-260315-7291', 'org_bantu_id', 'OPP-260315-7291', '560749ee-244f-4769-8cae-78a80f032418', 'P1', 'active', 'COMPANY_REGISTRATION', 'COMPANY_REGISTRATION', 50000, 'CNY', '想在印尼注册PMA公司', '', NULL, NULL, 'debf13e8-3a82-421b-bd87-6223ec60f0d3', 20261230, '企业微信', '{debf13e8-3a82-421b-bd87-6223ec60f0d3}', NULL, NULL, '2026-03-15 16:58:41.132', '2026-03-15 17:23:16.261', '8ca39950-5eb0-4a98-bb39-8b874f100bda'),
	('OPP-260315-2445', 'org_bantu_id', 'OPP-260315-2445', 'e7e23c1b-75ef-4ce6-b14b-9abfe302e79a', 'P1', 'active', 'VISA', 'VISA', 5000, 'CNY', '想办 B1 签证，自雇商人啊', '客户来自微信群', NULL, NULL, 'debf13e8-3a82-421b-bd87-6223ec60f0d3', 20261229, '印尼的总代理', '{debf13e8-3a82-421b-bd87-6223ec60f0d3}', NULL, NULL, '2026-03-15 16:41:48.008', '2026-03-15 17:25:29.844', 'a1f8e687-873b-499f-a1d0-0927f5ab5338'),
	('OPP-260315-1615', 'org_bantu_id', 'OPP-260315-1615', '560749ee-244f-4769-8cae-78a80f032418', 'P1', 'active', 'VISA', 'VISA', 123, 'IDR', '客户想要办理保时捷', '客户信息', NULL, NULL, 'debf13e8-3a82-421b-bd87-6223ec60f0d3', 1, '印尼的总代理', '{debf13e8-3a82-421b-bd87-6223ec60f0d3}', NULL, NULL, '2026-03-15 16:31:11.813', '2026-03-15 17:30:06.518', NULL);


--
-- Data for Name: action_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: action_log_attachments; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: customer_contacts; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: customer_followups; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: customer_followup_attachments; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: domestic_entities; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: domestic_entity_associations; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: opportunity_p8_data; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: expense_items; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: foreign_company_entities; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: interactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."interactions" ("id", "organizationId", "customerId", "leadId", "opportunityId", "operatorId", "type", "content", "nextAction", "nextActionDate", "createdAt", "updatedAt") VALUES
	('dc15cc73-6dea-4444-94ac-55c35c5db298', 'org_bantu_id', NULL, 'a1f8e687-873b-499f-a1d0-0927f5ab5338', NULL, 'debf13e8-3a82-421b-bd87-6223ec60f0d3', 'NOTE', '你好', NULL, NULL, '2026-03-15 15:36:06.181', '2026-03-15 15:36:06.181'),
	('23ddf0b3-1071-4395-b938-d7b9bc4050f5', 'org_bantu_id', NULL, 'a1f8e687-873b-499f-a1d0-0927f5ab5338', NULL, 'debf13e8-3a82-421b-bd87-6223ec60f0d3', 'NOTE', '你在干嘛', NULL, NULL, '2026-03-15 15:36:15.218', '2026-03-15 15:36:15.218'),
	('14ef39c9-a72e-4114-9e5b-53f598356149', 'org_bantu_id', NULL, 'a1f8e687-873b-499f-a1d0-0927f5ab5338', NULL, 'debf13e8-3a82-421b-bd87-6223ec60f0d3', 'SYSTEM', '状态变更：已联系 → 准备转商机', NULL, NULL, '2026-03-15 16:23:49.505', '2026-03-15 16:23:49.505'),
	('c72b30ae-5d44-4a4e-98e5-696e4d134c4c', 'org_bantu_id', NULL, NULL, NULL, 'debf13e8-3a82-421b-bd87-6223ec60f0d3', 'SYSTEM', '状态变更：新线索 → 准备转商机', NULL, NULL, '2026-03-15 16:58:15.531', '2026-03-15 16:58:15.531');


--
-- Data for Name: interaction_attachments; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: opportunity_p6_data; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: material_items; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: opportunity_p2_data; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: opportunity_p3_data; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: opportunity_p4_data; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: opportunity_p5_data; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: opportunity_p7_data; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: progress_points; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: refund_items; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."roles" ("id", "code", "name", "createdAt") VALUES
	('d0122358-bd90-49a4-b7ad-a5400300f5b4', 'ADMIN', '管理员', '2026-03-15 15:15:35.616'),
	('0e994d69-a7ac-4ef4-9349-2ae724b01765', 'SALES', '销售专员', '2026-03-15 15:15:35.616'),
	('f5137dfa-58c6-48a3-b7f1-498f5fb4cf27', 'FINANCE', '财务专员', '2026-03-15 15:15:35.616');


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: system_counters; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: user_organizations; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."user_organizations" ("userId", "organizationId", "roleId", "createdAt", "updatedAt") VALUES
	('debf13e8-3a82-421b-bd87-6223ec60f0d3', 'org_bantu_id', 'd0122358-bd90-49a4-b7ad-a5400300f5b4', '2026-03-15 15:15:35.616', '2026-03-15 15:15:35.616');


--
-- Data for Name: wechat_group_sequences; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."wechat_group_sequences" ("id", "createdAt") VALUES
	(1, '2026-03-15 16:31:11.729'),
	(2, '2026-03-15 16:36:21.292'),
	(20261229, '2026-03-15 16:41:47.866'),
	(20261230, '2026-03-15 16:58:41.063');


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 24, true);


--
-- Name: wechat_group_sequences_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."wechat_group_sequences_id_seq"', 20261230, true);


--
-- PostgreSQL database dump complete
--

-- \unrestrict gu68wV3sedZOHId9gQkgTqTXydjBHyFWnVVYz4KbKFcCPsTq4wgLTxFDUnsK6MV

RESET ALL;
