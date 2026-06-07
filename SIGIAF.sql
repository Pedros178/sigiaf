--
-- PostgreSQL database dump
--

\restrict kSDrV4rbcPpKhHLALP2oee53yev2EaQ5YXfhC3UJcxVcaGn7u3r0QFCya8Xu8PH

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.0

-- Started on 2026-04-07 13:48:53

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
-- TOC entry 234 (class 1255 OID 16568)
-- Name: marcar_activo_disponible(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.marcar_activo_disponible() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.estado = 'Devuelto' THEN
        UPDATE activos
        SET estado = 'Disponible'
        WHERE id_activo = NEW.id_activo;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.marcar_activo_disponible() OWNER TO postgres;

--
-- TOC entry 233 (class 1255 OID 16566)
-- Name: marcar_activo_no_disponible(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.marcar_activo_no_disponible() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE activos
    SET estado = 'No disponible'
    WHERE id_activo = NEW.id_activo;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.marcar_activo_no_disponible() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 226 (class 1259 OID 16433)
-- Name: activos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.activos (
    id_activo integer NOT NULL,
    codigo_qr character varying(255) NOT NULL,
    nombre character varying(150) NOT NULL,
    descripcion text,
    marca character varying(100),
    modelo character varying(100),
    numero_serie character varying(100),
    estado character varying(50) NOT NULL,
    ubicacion character varying(150),
    id_categoria integer NOT NULL,
    fecha_registro date DEFAULT CURRENT_DATE,
    valor_original numeric(12,2),
    valor_residual numeric(12,2) DEFAULT 0,
    fecha_adquisicion date,
    vida_util_custom integer
);


ALTER TABLE public.activos OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 16432)
-- Name: activos_id_activo_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.activos_id_activo_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.activos_id_activo_seq OWNER TO postgres;

--
-- TOC entry 5096 (class 0 OID 0)
-- Dependencies: 225
-- Name: activos_id_activo_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.activos_id_activo_seq OWNED BY public.activos.id_activo;


--
-- TOC entry 232 (class 1259 OID 16572)
-- Name: bitacora; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bitacora (
    id integer NOT NULL,
    id_usuario integer,
    nombre_usuario character varying(100),
    accion character varying(100) NOT NULL,
    modulo character varying(50) NOT NULL,
    descripcion text,
    ip character varying(45),
    fecha timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.bitacora OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 16571)
-- Name: bitacora_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bitacora_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bitacora_id_seq OWNER TO postgres;

--
-- TOC entry 5097 (class 0 OID 0)
-- Dependencies: 231
-- Name: bitacora_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bitacora_id_seq OWNED BY public.bitacora.id;


--
-- TOC entry 224 (class 1259 OID 16422)
-- Name: categorias; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categorias (
    id_categoria integer NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion text
);


ALTER TABLE public.categorias OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 16421)
-- Name: categorias_id_categoria_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.categorias_id_categoria_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categorias_id_categoria_seq OWNER TO postgres;

--
-- TOC entry 5098 (class 0 OID 0)
-- Dependencies: 223
-- Name: categorias_id_categoria_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.categorias_id_categoria_seq OWNED BY public.categorias.id_categoria;


--
-- TOC entry 228 (class 1259 OID 16479)
-- Name: mantenimientos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.mantenimientos (
    id_mantenimiento integer NOT NULL,
    id_activo integer NOT NULL,
    tipo character varying(50) NOT NULL,
    descripcion text,
    fecha date NOT NULL,
    responsable character varying(100),
    costo numeric(10,2)
);


ALTER TABLE public.mantenimientos OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 16478)
-- Name: mantenimientos_id_mantenimiento_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.mantenimientos_id_mantenimiento_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.mantenimientos_id_mantenimiento_seq OWNER TO postgres;

--
-- TOC entry 5099 (class 0 OID 0)
-- Dependencies: 227
-- Name: mantenimientos_id_mantenimiento_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.mantenimientos_id_mantenimiento_seq OWNED BY public.mantenimientos.id_mantenimiento;


--
-- TOC entry 230 (class 1259 OID 16546)
-- Name: prestamos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.prestamos (
    id integer NOT NULL,
    id_activo integer NOT NULL,
    responsable character varying(150) NOT NULL,
    fecha_prestamo timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fecha_devolucion_programada date NOT NULL,
    fecha_devolucion_real timestamp without time zone,
    estado character varying(20) DEFAULT 'Prestado'::character varying,
    condicion_entrega text,
    condicion_retorno text,
    observaciones text,
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.prestamos OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 16545)
-- Name: prestamos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.prestamos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.prestamos_id_seq OWNER TO postgres;

--
-- TOC entry 5100 (class 0 OID 0)
-- Dependencies: 229
-- Name: prestamos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.prestamos_id_seq OWNED BY public.prestamos.id;


--
-- TOC entry 220 (class 1259 OID 16390)
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id_rol integer NOT NULL,
    nombre character varying(50) NOT NULL
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 16389)
-- Name: roles_id_rol_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.roles_id_rol_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_id_rol_seq OWNER TO postgres;

--
-- TOC entry 5101 (class 0 OID 0)
-- Dependencies: 219
-- Name: roles_id_rol_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_id_rol_seq OWNED BY public.roles.id_rol;


--
-- TOC entry 222 (class 1259 OID 16401)
-- Name: usuarios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usuarios (
    id_usuario integer NOT NULL,
    nombre character varying(100) NOT NULL,
    correo character varying(100) NOT NULL,
    password character varying(255) NOT NULL,
    id_rol integer NOT NULL,
    activo boolean DEFAULT true,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.usuarios OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 16400)
-- Name: usuarios_id_usuario_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.usuarios_id_usuario_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.usuarios_id_usuario_seq OWNER TO postgres;

--
-- TOC entry 5102 (class 0 OID 0)
-- Dependencies: 221
-- Name: usuarios_id_usuario_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.usuarios_id_usuario_seq OWNED BY public.usuarios.id_usuario;


--
-- TOC entry 4893 (class 2604 OID 16436)
-- Name: activos id_activo; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activos ALTER COLUMN id_activo SET DEFAULT nextval('public.activos_id_activo_seq'::regclass);


--
-- TOC entry 4901 (class 2604 OID 16575)
-- Name: bitacora id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bitacora ALTER COLUMN id SET DEFAULT nextval('public.bitacora_id_seq'::regclass);


--
-- TOC entry 4892 (class 2604 OID 16425)
-- Name: categorias id_categoria; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categorias ALTER COLUMN id_categoria SET DEFAULT nextval('public.categorias_id_categoria_seq'::regclass);


--
-- TOC entry 4896 (class 2604 OID 16482)
-- Name: mantenimientos id_mantenimiento; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mantenimientos ALTER COLUMN id_mantenimiento SET DEFAULT nextval('public.mantenimientos_id_mantenimiento_seq'::regclass);


--
-- TOC entry 4897 (class 2604 OID 16549)
-- Name: prestamos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prestamos ALTER COLUMN id SET DEFAULT nextval('public.prestamos_id_seq'::regclass);


--
-- TOC entry 4888 (class 2604 OID 16393)
-- Name: roles id_rol; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles ALTER COLUMN id_rol SET DEFAULT nextval('public.roles_id_rol_seq'::regclass);


--
-- TOC entry 4889 (class 2604 OID 16404)
-- Name: usuarios id_usuario; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id_usuario SET DEFAULT nextval('public.usuarios_id_usuario_seq'::regclass);


--
-- TOC entry 5084 (class 0 OID 16433)
-- Dependencies: 226
-- Data for Name: activos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.activos (id_activo, codigo_qr, nombre, descripcion, marca, modelo, numero_serie, estado, ubicacion, id_categoria, fecha_registro, valor_original, valor_residual, fecha_adquisicion, vida_util_custom) FROM stdin;
2	QR002	Switch Cisco	Equipo de red	Cisco	2960	XYZ456	Disponible	Site Principal	3	2026-02-06	\N	0.00	\N	\N
3	QR003	Escritorio Ejecutivo	Mueble oficina	OfficeMax	DX100	MOB789	No disponible	Gerencia	2	2026-02-06	\N	0.00	\N	\N
1	QR001	Laptop HP	Equipo administrativo	HP	Probook	ABC123	No disponible	Oficina 1	1	2026-02-06	15000.00	500.00	2024-02-06	\N
\.


--
-- TOC entry 5090 (class 0 OID 16572)
-- Dependencies: 232
-- Data for Name: bitacora; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bitacora (id, id_usuario, nombre_usuario, accion, modulo, descripcion, ip, fecha) FROM stdin;
1	2	Administrador General	LOGIN	Autenticación	Inicio de sesión exitoso — rol: admin	::1	2026-04-03 22:33:52.439383
2	2	Administrador General	LOGIN	Autenticación	Inicio de sesión exitoso — rol: admin	::1	2026-04-04 14:32:07.706632
3	2	Administrador General	LOGIN	Autenticación	Inicio de sesión exitoso — rol: admin	::1	2026-04-07 12:45:55.284932
\.


--
-- TOC entry 5082 (class 0 OID 16422)
-- Dependencies: 224
-- Data for Name: categorias; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categorias (id_categoria, nombre, descripcion) FROM stdin;
1	Computo	Equipos de computo
2	Mobiliario	Muebles de oficina
3	Redes	Equipos de red
\.


--
-- TOC entry 5086 (class 0 OID 16479)
-- Dependencies: 228
-- Data for Name: mantenimientos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.mantenimientos (id_mantenimiento, id_activo, tipo, descripcion, fecha, responsable, costo) FROM stdin;
1	1	Correctivo		2026-04-08	Ing. Carrera	120.00
\.


--
-- TOC entry 5088 (class 0 OID 16546)
-- Dependencies: 230
-- Data for Name: prestamos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.prestamos (id, id_activo, responsable, fecha_prestamo, fecha_devolucion_programada, fecha_devolucion_real, estado, condicion_entrega, condicion_retorno, observaciones, creado_en) FROM stdin;
4	1	Departamento de Sistemas y Computo	2026-04-03 15:26:34.454148	2026-04-03	\N	Prestado	Excelente	\N		2026-04-03 15:26:34.454148
5	3	Vinculacion y Planeacion	2026-04-03 15:27:37.240935	2026-04-04	\N	Prestado	Excelente	\N	Prestamo para reunion ejecutiva	2026-04-03 15:27:37.240935
\.


--
-- TOC entry 5078 (class 0 OID 16390)
-- Dependencies: 220
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (id_rol, nombre) FROM stdin;
1	admin
2	usuario
3	tecnico
\.


--
-- TOC entry 5080 (class 0 OID 16401)
-- Dependencies: 222
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.usuarios (id_usuario, nombre, correo, password, id_rol, activo, fecha_creacion) FROM stdin;
2	Administrador General	admin@login.com	$2b$10$D9M1gpbXW83ksLo3/Pd0b.nJhQbKf7s9ChNl7ZjaB121PewxkcCPu	1	t	2026-02-06 22:34:24.112357
\.


--
-- TOC entry 5103 (class 0 OID 0)
-- Dependencies: 225
-- Name: activos_id_activo_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.activos_id_activo_seq', 3, true);


--
-- TOC entry 5104 (class 0 OID 0)
-- Dependencies: 231
-- Name: bitacora_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.bitacora_id_seq', 3, true);


--
-- TOC entry 5105 (class 0 OID 0)
-- Dependencies: 223
-- Name: categorias_id_categoria_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categorias_id_categoria_seq', 3, true);


--
-- TOC entry 5106 (class 0 OID 0)
-- Dependencies: 227
-- Name: mantenimientos_id_mantenimiento_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.mantenimientos_id_mantenimiento_seq', 1, true);


--
-- TOC entry 5107 (class 0 OID 0)
-- Dependencies: 229
-- Name: prestamos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.prestamos_id_seq', 5, true);


--
-- TOC entry 5108 (class 0 OID 0)
-- Dependencies: 219
-- Name: roles_id_rol_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_id_rol_seq', 3, true);


--
-- TOC entry 5109 (class 0 OID 0)
-- Dependencies: 221
-- Name: usuarios_id_usuario_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.usuarios_id_usuario_seq', 2, true);


--
-- TOC entry 4914 (class 2606 OID 16448)
-- Name: activos activos_codigo_qr_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activos
    ADD CONSTRAINT activos_codigo_qr_key UNIQUE (codigo_qr);


--
-- TOC entry 4916 (class 2606 OID 16446)
-- Name: activos activos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activos
    ADD CONSTRAINT activos_pkey PRIMARY KEY (id_activo);


--
-- TOC entry 4922 (class 2606 OID 16583)
-- Name: bitacora bitacora_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bitacora
    ADD CONSTRAINT bitacora_pkey PRIMARY KEY (id);


--
-- TOC entry 4912 (class 2606 OID 16431)
-- Name: categorias categorias_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categorias
    ADD CONSTRAINT categorias_pkey PRIMARY KEY (id_categoria);


--
-- TOC entry 4918 (class 2606 OID 16490)
-- Name: mantenimientos mantenimientos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mantenimientos
    ADD CONSTRAINT mantenimientos_pkey PRIMARY KEY (id_mantenimiento);


--
-- TOC entry 4920 (class 2606 OID 16560)
-- Name: prestamos prestamos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prestamos
    ADD CONSTRAINT prestamos_pkey PRIMARY KEY (id);


--
-- TOC entry 4904 (class 2606 OID 16399)
-- Name: roles roles_nombre_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_nombre_key UNIQUE (nombre);


--
-- TOC entry 4906 (class 2606 OID 16397)
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id_rol);


--
-- TOC entry 4908 (class 2606 OID 16415)
-- Name: usuarios usuarios_correo_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_correo_key UNIQUE (correo);


--
-- TOC entry 4910 (class 2606 OID 16413)
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id_usuario);


--
-- TOC entry 4928 (class 2620 OID 16567)
-- Name: prestamos trg_prestamo_insert; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_prestamo_insert AFTER INSERT ON public.prestamos FOR EACH ROW EXECUTE FUNCTION public.marcar_activo_no_disponible();


--
-- TOC entry 4929 (class 2620 OID 16569)
-- Name: prestamos trg_prestamo_update; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_prestamo_update AFTER UPDATE ON public.prestamos FOR EACH ROW EXECUTE FUNCTION public.marcar_activo_disponible();


--
-- TOC entry 4924 (class 2606 OID 16449)
-- Name: activos activos_id_categoria_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activos
    ADD CONSTRAINT activos_id_categoria_fkey FOREIGN KEY (id_categoria) REFERENCES public.categorias(id_categoria);


--
-- TOC entry 4927 (class 2606 OID 16584)
-- Name: bitacora bitacora_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bitacora
    ADD CONSTRAINT bitacora_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuarios(id_usuario);


--
-- TOC entry 4926 (class 2606 OID 16561)
-- Name: prestamos fk_activo; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prestamos
    ADD CONSTRAINT fk_activo FOREIGN KEY (id_activo) REFERENCES public.activos(id_activo) ON DELETE CASCADE;


--
-- TOC entry 4925 (class 2606 OID 16491)
-- Name: mantenimientos mantenimientos_id_activo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mantenimientos
    ADD CONSTRAINT mantenimientos_id_activo_fkey FOREIGN KEY (id_activo) REFERENCES public.activos(id_activo);


--
-- TOC entry 4923 (class 2606 OID 16416)
-- Name: usuarios usuarios_id_rol_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_id_rol_fkey FOREIGN KEY (id_rol) REFERENCES public.roles(id_rol);


-- Completed on 2026-04-07 13:48:55

--
-- PostgreSQL database dump complete
--

\unrestrict kSDrV4rbcPpKhHLALP2oee53yev2EaQ5YXfhC3UJcxVcaGn7u3r0QFCya8Xu8PH

