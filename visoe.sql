PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'customer', -- 'admin' atau 'customer'
    phone TEXT,
    address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "users" ("id","name","email","password_hash","role","phone","address","created_at","updated_at") VALUES('USR-8K70QNHL','Arman Maulana','visoeluxury.com@gmail.com','b24478edcfd65b73fff31745150945fc1ee46086fd599119d154cee8190bef96','customer','08131119285',replace(replace('Kp. Mareleng RT 002 RW 002\r\nDesa Cipeuyeum Haurwangi','\r',char(13)),'\n',char(10)),'2026-03-08 22:26:39','2026-03-08 22:26:53');
INSERT INTO "users" ("id","name","email","password_hash","role","phone","address","created_at","updated_at") VALUES('GUEST-dzx94apd4z','Vee Visoe','visoeluxury@gmail.com','guest-account','customer','0811133455675','Jalan radio Dalam no.88','2026-03-09 05:47:54','2026-03-09 05:47:54');
INSERT INTO "users" ("id","name","email","password_hash","role","phone","address","created_at","updated_at") VALUES('GUEST-btnbiv6u6ar','Vee Visoe','101payasia@gmail.com','guest-account','customer','08131119285','Jalan radio Dalam no.88','2026-03-09 06:09:29','2026-03-09 06:09:29');
CREATE TABLE categories (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
, parent_id TEXT);
INSERT INTO "categories" ("id","slug","name","description","created_at","parent_id") VALUES('2yt5b1u6s9j','bags','Bags',NULL,'2026-03-07 14:45:38',NULL);
CREATE TABLE products (
    id TEXT PRIMARY KEY,
    category_id TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    brand TEXT NOT NULL, -- Penting untuk barang premium
    condition TEXT NOT NULL, -- Misal: 'Pristine', 'Excellent', 'Very Good'
    description TEXT NOT NULL,
    price INTEGER NOT NULL, -- Disimpan dalam satuan terkecil (misal Rupiah tanpa desimal)
    compare_at_price INTEGER, -- Untuk fitur diskon / harga coret
    stock INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1, -- 1 = Aktif, 0 = Draft/Sembunyi
    images_json TEXT NOT NULL, -- Array URL dari R2 disimpan dalam format JSON (contoh: '["url1", "url2"]')
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, brand_serial TEXT, inclusions TEXT, dimensions TEXT, exterior_material TEXT, interior_material TEXT, hardware_color TEXT, model_name TEXT, production_year TEXT, color TEXT, weight INTEGER DEFAULT 500,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
);
INSERT INTO "products" ("id","category_id","slug","name","brand","condition","description","price","compare_at_price","stock","is_active","images_json","created_at","updated_at","brand_serial","inclusions","dimensions","exterior_material","interior_material","hardware_color","model_name","production_year","color","weight") VALUES('w3gvxuiw6n','2yt5b1u6s9j','small-chanel-coco-chevron-with-lizard-handle-fxec3','Small Chanel Coco Chevron with Lizard Handle','Givenchy','Excellent','<p>The colour/s shown may differ from the actual colour/s due to individual''s screen settings. Potential sizing difference between 0.5cm to 1cm for bags and accessories, and up to 0.5cm difference for shoes may occur as well.<br></p>',8460000,NULL,10,1,'["https://cdn.visoeluxury.com/1772895993741-right-image.jpeg","https://cdn.visoeluxury.com/1772896436776-back-image.jpeg","https://cdn.visoeluxury.com/1772896437152-bottom-image.jpeg","https://cdn.visoeluxury.com/1772896437637-detail-condition-image.jpeg","https://cdn.visoeluxury.com/1772896438087-front-image.jpeg","https://cdn.visoeluxury.com/1772896438520-inclusion-image.jpeg","https://cdn.visoeluxury.com/1772896439074-inside-image.jpeg","https://cdn.visoeluxury.com/1772896439529-left-image.jpeg","https://cdn.visoeluxury.com/1772896439937-right-image.jpeg","https://cdn.visoeluxury.com/1772896448490-additional-photo-image.jpeg"]','2026-03-07 15:06:34','2026-03-07 15:06:34',NULL,'Box, Care Booklet, Copy Receipt, Detachable Chain Shoulder Strap, Dust Bag, Tag','	23x10x14','Lizard Leather, Caviar Leather',NULL,'Gold-Tone',NULL,'2020','Nude, Maroon',250);
CREATE TABLE orders (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'paid', 'shipped', 'completed', 'cancelled'
    total_amount INTEGER NOT NULL,
    shipping_address TEXT NOT NULL,
    tracking_number TEXT,
    payment_method TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, payment_url TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
);
INSERT INTO "orders" ("id","user_id","status","total_amount","shipping_address","tracking_number","payment_method","created_at","updated_at","payment_url") VALUES('ORD-09489072BMBU','USR-8K70QNHL','PENDING',8460000,replace(replace('Kp. Mareleng RT 002 RW 002\r\nDesa Cipeuyeum Haurwangi','\r',char(13)),'\n',char(10)),NULL,'101payasia-card_fullpayment','2026-03-08 22:38:09','2026-03-08 22:38:09',NULL);
INSERT INTO "orders" ("id","user_id","status","total_amount","shipping_address","tracking_number","payment_method","created_at","updated_at","payment_url") VALUES('ORD-0958895221HV','USR-8K70QNHL','PENDING',8460000,replace(replace('Kp. Mareleng RT 002 RW 002\r\nDesa Cipeuyeum Haurwangi','\r',char(13)),'\n',char(10)),NULL,'101payasia-card_fullpayment','2026-03-08 22:39:48','2026-03-08 22:39:48',NULL);
INSERT INTO "orders" ("id","user_id","status","total_amount","shipping_address","tracking_number","payment_method","created_at","updated_at","payment_url") VALUES('ORD-09869723W7G4','USR-8K70QNHL','PENDING',8460000,replace(replace('Kp. Mareleng RT 002 RW 002\r\nDesa Cipeuyeum Haurwangi','\r',char(13)),'\n',char(10)),NULL,'101payasia-card_fullpayment','2026-03-08 22:44:29','2026-03-08 22:44:29',NULL);
INSERT INTO "orders" ("id","user_id","status","total_amount","shipping_address","tracking_number","payment_method","created_at","updated_at","payment_url") VALUES('ORD-0992225422TV','USR-8K70QNHL','PENDING',8460000,replace(replace('Kp. Mareleng RT 002 RW 002\r\nDesa Cipeuyeum Haurwangi','\r',char(13)),'\n',char(10)),NULL,'101payasia-card_fullpayment','2026-03-08 22:45:22','2026-03-08 22:45:22',NULL);
INSERT INTO "orders" ("id","user_id","status","total_amount","shipping_address","tracking_number","payment_method","created_at","updated_at","payment_url") VALUES('ORD-10022770068M','USR-8K70QNHL','PENDING',8460000,replace(replace('Kp. Mareleng RT 002 RW 002\r\nDesa Cipeuyeum Haurwangi','\r',char(13)),'\n',char(10)),NULL,'101payasia-card_fullpayment','2026-03-08 22:47:02','2026-03-08 22:47:02',NULL);
INSERT INTO "orders" ("id","user_id","status","total_amount","shipping_address","tracking_number","payment_method","created_at","updated_at","payment_url") VALUES('ORD-10134925E37C','USR-8K70QNHL','PENDING',8460000,replace(replace('Kp. Mareleng RT 002 RW 002\r\nDesa Cipeuyeum Haurwangi','\r',char(13)),'\n',char(10)),NULL,'101payasia-card_fullpayment','2026-03-08 22:48:54','2026-03-08 22:48:54',NULL);
INSERT INTO "orders" ("id","user_id","status","total_amount","shipping_address","tracking_number","payment_method","created_at","updated_at","payment_url") VALUES('ORD-10847919DDDH','USR-8K70QNHL','PENDING',8460000,replace(replace('Kp. Mareleng RT 002 RW 002\r\nDesa Cipeuyeum Haurwangi','\r',char(13)),'\n',char(10)),NULL,'101payasia-card_fullpayment','2026-03-08 23:00:47','2026-03-08 23:00:47',NULL);
INSERT INTO "orders" ("id","user_id","status","total_amount","shipping_address","tracking_number","payment_method","created_at","updated_at","payment_url") VALUES('ORD-11805606QSAB','USR-8K70QNHL','PENDING',8460000,replace(replace('Kp. Mareleng RT 002 RW 002\r\nDesa Cipeuyeum Haurwangi','\r',char(13)),'\n',char(10)),NULL,'101payasia-card_fullpayment','2026-03-08 23:16:45','2026-03-08 23:16:45',NULL);
INSERT INTO "orders" ("id","user_id","status","total_amount","shipping_address","tracking_number","payment_method","created_at","updated_at","payment_url") VALUES('ORD-11905127PB8R','USR-8K70QNHL','PENDING',8460000,replace(replace('Kp. Mareleng RT 002 RW 002\r\nDesa Cipeuyeum Haurwangi','\r',char(13)),'\n',char(10)),NULL,'101payasia-card_fullpayment','2026-03-08 23:18:25','2026-03-08 23:18:25',NULL);
INSERT INTO "orders" ("id","user_id","status","total_amount","shipping_address","tracking_number","payment_method","created_at","updated_at","payment_url") VALUES('ORD-12357910LBBC','USR-8K70QNHL','PENDING',8460000,replace(replace('Kp. Mareleng RT 002 RW 002\r\nDesa Cipeuyeum Haurwangi','\r',char(13)),'\n',char(10)),NULL,'101payasia-card_fullpayment','2026-03-08 23:25:57','2026-03-08 23:25:57',NULL);
INSERT INTO "orders" ("id","user_id","status","total_amount","shipping_address","tracking_number","payment_method","created_at","updated_at","payment_url") VALUES('ORD-12423853DOVV','USR-8K70QNHL','PENDING',8460000,replace(replace('Kp. Mareleng RT 002 RW 002\r\nDesa Cipeuyeum Haurwangi','\r',char(13)),'\n',char(10)),NULL,'101payasia-card_fullpayment','2026-03-08 23:27:03','2026-03-08 23:27:03',NULL);
INSERT INTO "orders" ("id","user_id","status","total_amount","shipping_address","tracking_number","payment_method","created_at","updated_at","payment_url") VALUES('ORD-13413464P5M3','USR-8K70QNHL','PENDING',8460000,replace(replace('Kp. Mareleng RT 002 RW 002\r\nDesa Cipeuyeum Haurwangi','\r',char(13)),'\n',char(10)),NULL,'card_fullpayment','2026-03-08 23:43:33','2026-03-08 23:43:33',NULL);
INSERT INTO "orders" ("id","user_id","status","total_amount","shipping_address","tracking_number","payment_method","created_at","updated_at","payment_url") VALUES('ORD-14144147UMOQ','USR-8K70QNHL','PENDING',8460000,replace(replace('Kp. Mareleng RT 002 RW 002\r\nDesa Cipeuyeum Haurwangi','\r',char(13)),'\n',char(10)),NULL,'card_fullpayment','2026-03-08 23:55:44','2026-03-08 23:55:44',NULL);
INSERT INTO "orders" ("id","user_id","status","total_amount","shipping_address","tracking_number","payment_method","created_at","updated_at","payment_url") VALUES('ORD-142583658OCZ','USR-8K70QNHL','PENDING',8460000,replace(replace('Kp. Mareleng RT 002 RW 002\r\nDesa Cipeuyeum Haurwangi','\r',char(13)),'\n',char(10)),NULL,'card_fullpayment','2026-03-08 23:57:38','2026-03-08 23:57:38',NULL);
INSERT INTO "orders" ("id","user_id","status","total_amount","shipping_address","tracking_number","payment_method","created_at","updated_at","payment_url") VALUES('ORD-15286364DTTC','USR-8K70QNHL','PENDING',8460000,replace(replace('Kp. Mareleng RT 002 RW 002\r\nDesa Cipeuyeum Haurwangi','\r',char(13)),'\n',char(10)),NULL,'card_fullpayment','2026-03-09 00:14:46','2026-03-09 00:14:46',NULL);
INSERT INTO "orders" ("id","user_id","status","total_amount","shipping_address","tracking_number","payment_method","created_at","updated_at","payment_url") VALUES('ORD-15973494AFYU','USR-8K70QNHL','PENDING',8460000,replace(replace('Kp. Mareleng RT 002 RW 002\r\nDesa Cipeuyeum Haurwangi','\r',char(13)),'\n',char(10)),NULL,'card_fullpayment','2026-03-09 00:26:13','2026-03-09 00:26:15','https://pay.flashmobile.id/9bed1218a32143358e2ccae22bd4e914');
INSERT INTO "orders" ("id","user_id","status","total_amount","shipping_address","tracking_number","payment_method","created_at","updated_at","payment_url") VALUES('ORD-16512305Y23F','USR-8K70QNHL','PENDING',8460000,replace(replace('Kp. Mareleng RT 002 RW 002\r\nDesa Cipeuyeum Haurwangi','\r',char(13)),'\n',char(10)),NULL,'card_fullpayment','2026-03-09 00:35:12','2026-03-09 00:35:16','https://pay.flashmobile.id/1fdf8695900840ee9e95cfdf1aa45a16');
INSERT INTO "orders" ("id","user_id","status","total_amount","shipping_address","tracking_number","payment_method","created_at","updated_at","payment_url") VALUES('ORD-35273398YCL6','GUEST-dzx94apd4z','PENDING',8460000,'Jalan radio Dalam no.88',NULL,'card_fullpayment','2026-03-09 05:47:54','2026-03-09 05:47:57','https://pay.flashmobile.id/6a5024b21a764797bd6115ffdc9171a7');
INSERT INTO "orders" ("id","user_id","status","total_amount","shipping_address","tracking_number","payment_method","created_at","updated_at","payment_url") VALUES('ORD-36569251TD0A','GUEST-btnbiv6u6ar','PENDING',8460000,'Jalan radio Dalam no.88',NULL,'card_fullpayment','2026-03-09 06:09:29','2026-03-09 06:09:31','https://pay.flashmobile.id/5ab3e0d8a47844dc8be9b085a345797f');
CREATE TABLE order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    price_at_purchase INTEGER NOT NULL, -- Menyimpan harga saat itu walau harga produk berubah nanti
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);
INSERT INTO "order_items" ("id","order_id","product_id","quantity","price_at_purchase") VALUES('oq4tjopg6y','ORD-09489072BMBU','w3gvxuiw6n',1,8460000);
INSERT INTO "order_items" ("id","order_id","product_id","quantity","price_at_purchase") VALUES('hkufdwtlauq','ORD-0958895221HV','w3gvxuiw6n',1,8460000);
INSERT INTO "order_items" ("id","order_id","product_id","quantity","price_at_purchase") VALUES('ffh9f6ti0wr','ORD-09869723W7G4','w3gvxuiw6n',1,8460000);
INSERT INTO "order_items" ("id","order_id","product_id","quantity","price_at_purchase") VALUES('ml5xjtb7e7g','ORD-0992225422TV','w3gvxuiw6n',1,8460000);
INSERT INTO "order_items" ("id","order_id","product_id","quantity","price_at_purchase") VALUES('7d5rrl6ml58','ORD-10022770068M','w3gvxuiw6n',1,8460000);
INSERT INTO "order_items" ("id","order_id","product_id","quantity","price_at_purchase") VALUES('j3wf2z55lrq','ORD-10134925E37C','w3gvxuiw6n',1,8460000);
INSERT INTO "order_items" ("id","order_id","product_id","quantity","price_at_purchase") VALUES('ewx0lm330sb','ORD-10847919DDDH','w3gvxuiw6n',1,8460000);
INSERT INTO "order_items" ("id","order_id","product_id","quantity","price_at_purchase") VALUES('as5k3isfw26','ORD-11805606QSAB','w3gvxuiw6n',1,8460000);
INSERT INTO "order_items" ("id","order_id","product_id","quantity","price_at_purchase") VALUES('oygn6sn328','ORD-11905127PB8R','w3gvxuiw6n',1,8460000);
INSERT INTO "order_items" ("id","order_id","product_id","quantity","price_at_purchase") VALUES('75etbgyrhqm','ORD-12357910LBBC','w3gvxuiw6n',1,8460000);
INSERT INTO "order_items" ("id","order_id","product_id","quantity","price_at_purchase") VALUES('b7th7cre89i','ORD-12423853DOVV','w3gvxuiw6n',1,8460000);
INSERT INTO "order_items" ("id","order_id","product_id","quantity","price_at_purchase") VALUES('ud0tqxwqr6i','ORD-13413464P5M3','w3gvxuiw6n',1,8460000);
INSERT INTO "order_items" ("id","order_id","product_id","quantity","price_at_purchase") VALUES('ovsvjv65xg','ORD-14144147UMOQ','w3gvxuiw6n',1,8460000);
INSERT INTO "order_items" ("id","order_id","product_id","quantity","price_at_purchase") VALUES('6m9xtdf9cag','ORD-142583658OCZ','w3gvxuiw6n',1,8460000);
INSERT INTO "order_items" ("id","order_id","product_id","quantity","price_at_purchase") VALUES('qhct8x9g0li','ORD-15286364DTTC','w3gvxuiw6n',1,8460000);
INSERT INTO "order_items" ("id","order_id","product_id","quantity","price_at_purchase") VALUES('3mgq3o0adi3','ORD-15973494AFYU','w3gvxuiw6n',1,8460000);
INSERT INTO "order_items" ("id","order_id","product_id","quantity","price_at_purchase") VALUES('1k82l4hpsvd','ORD-16512305Y23F','w3gvxuiw6n',1,8460000);
INSERT INTO "order_items" ("id","order_id","product_id","quantity","price_at_purchase") VALUES('c3bry8uj6kg','ORD-35273398YCL6','w3gvxuiw6n',1,8460000);
INSERT INTO "order_items" ("id","order_id","product_id","quantity","price_at_purchase") VALUES('p3vyocyhp4','ORD-36569251TD0A','w3gvxuiw6n',1,8460000);
CREATE TABLE frontpage_widgets (     id INTEGER PRIMARY KEY AUTOINCREMENT,     widget_type TEXT NOT NULL,     title TEXT,     content_json TEXT,     display_order INTEGER DEFAULT 0,     is_active INTEGER DEFAULT 1 , page_id TEXT DEFAULT 'home');
INSERT INTO "frontpage_widgets" ("id","widget_type","title","content_json","display_order","is_active","page_id") VALUES(1,'hero_slider','NEW HERO SLIDER','{"slides":[{"title":"Test","link":"https://www.visoeluxury.com/products?category=bags","image":"https://cdn.visoeluxury.com/1772895993741-right-image.jpeg"},{"title":"Test 2","link":"https://www.visoeluxury.com/products?category=bags","image":"https://cdn.visoeluxury.com/1772920594401-store.png"},{"title":"Ramadhan","link":"https://www.visoeluxury.com/","image":"https://img.huntstreet.com/uploads/others/banner/home/images/000/000/166/large/Banners%20-%20Web%20-%20Ramadan.jpg"}]}',1,1,'home');
INSERT INTO "frontpage_widgets" ("id","widget_type","title","content_json","display_order","is_active","page_id") VALUES(2,'promo_banner','NEW PROMO BANNER','{"promos":[{"title":"Test Banner","subtitle":"Test descriptions","button_text":"SHOW ALL","link":"https://www.visoeluxury.com/products?category=bags","image":"https://cdn.visoeluxury.com/1772895993741-right-image.jpeg"},{"title":"Test Banner 2","subtitle":"Test descriptions","button_text":"SHOP NOW","link":"https://www.visoeluxury.com/products?category=bags","image":"https://cdn.visoeluxury.com/1772895993741-right-image.jpeg"}]}',5,1,'home');
INSERT INTO "frontpage_widgets" ("id","widget_type","title","content_json","display_order","is_active","page_id") VALUES(3,'featured_products','NEW FEATURED PRODUCTS','{"product_ids":["w3gvxuiw6n"]}',2,1,'home');
INSERT INTO "frontpage_widgets" ("id","widget_type","title","content_json","display_order","is_active","page_id") VALUES(4,'new_arrivals','NEW ARRIVALS','{"description":"Discover the newest gems from our community of sellers. New drops daily at 3pm!","button_text":"Shop Now","button_link":"https://www.visoeluxury.com/products?category=bags","product_ids":["w3gvxuiw6n"]}',3,1,'home');
INSERT INTO "frontpage_widgets" ("id","widget_type","title","content_json","display_order","is_active","page_id") VALUES(6,'icon_nav','NEW ICON NAV','{"items":[{"title":"Big Sale","link":"#","image":"https://cdn.visoeluxury.com/big-sale.gif"},{"title":"GIVENCHY","link":"https://www.visoeluxury.com/products?brand=Givenchy","image":"https://hypesneakerid.com/wp-content/uploads/2024/07/Screenshot-2024-07-28-221641-600x600.png"},{"title":"DIOR","link":"https://www.visoeluxury.com/products?brand=Dior","image":"https://cdn.visoeluxury.com/dior.png"},{"title":"Hermès","link":"https://www.visoeluxury.com/products?brand=Hermes","image":"https://cdn.visoeluxury.com/hermes.png"},{"title":"Chanel","link":"https://www.visoeluxury.com/products?brand=Chanel","image":"https://cdn.visoeluxury.com/chanel.png"}]}',4,1,'home');
INSERT INTO "frontpage_widgets" ("id","widget_type","title","content_json","display_order","is_active","page_id") VALUES(8,'footer_widget','NEW FOOTER WIDGET','{"layout":"4","columns":[{"title":"Viseo Luxury","image":"https://cdn.visoeluxury.com/1772920594401-store.png","text":"<b>Viseo Luxury</b> adalah penyedia barang bermerek (branded) terkemuka yang telah membangun reputasi sebagai yang terbaik dan paling tepercaya di kelasnya. Kami mengkurasi koleksi produk mewah dengan standar kualitas tertinggi, menjamin keaslian dan eksklusivitas bagi setiap pelanggan.","links":[]},{"title":"Menu","image":"","text":"","links":[{"name":"Home","url":"/"},{"name":"Shop","url":"/products"},{"name":"Givenchy","url":"/products?brand=Givenchy"},{"name":"Dior","url":"/products?brand=Dior"},{"name":"Chanel","url":"/products?brand=Chanel"}]},{"title":"Links","image":"","text":"","links":[{"name":"Syarat dan Ketentuan","url":"/terms"},{"name":"Faqs","url":"/faqs"},{"name":"Tentang","url":"/about"},{"name":"Kontak","url":"/contact"}]},{"title":"Social Media","image":"","text":"","links":[{"name":"Instagram","url":"/"},{"name":"Facebook","url":"/products"},{"name":"Tiktok","url":"/products?brand=Givenchy"},{"name":"Youtube","url":"/products?brand=Dior"}]}]}',1,1,'GLOBAL');
INSERT INTO "frontpage_widgets" ("id","widget_type","title","content_json","display_order","is_active","page_id") VALUES(9,'custom_title','NEW CUSTOM TITLE','{"text":"YOUR CUSTOM TITLE","font_size":"text-3xl","align":"center","text_color":"#d12323"}',6,1,'home');
INSERT INTO "frontpage_widgets" ("id","widget_type","title","content_json","display_order","is_active","page_id") VALUES(999999,'header_widget','Global Header','{"logo":"","favicon":"","show_search":true,"show_cart":true,"links":[{"name":"Home","url":"/"},{"name":"Shop","url":"/products"}]}',0,1,'GLOBAL');
INSERT INTO "frontpage_widgets" ("id","widget_type","title","content_json","display_order","is_active","page_id") VALUES(1000001,'custom_title','NEW CUSTOM TITLE','{"text":"Selamat Datang","font_size":"text-3xl","align":"center","text_color":"#000000"}',3,1,'6c3ja2xous');
INSERT INTO "frontpage_widgets" ("id","widget_type","title","content_json","display_order","is_active","page_id") VALUES(1000002,'custom_paragraph','NEW CUSTOM PARAGRAPH','{"text":"Ini adalah halaman percobaan saja untuk website baru beserta seluruh fungsinya.\nIni adalah halaman percobaan saja untuk website baru beserta seluruh fungsinya.\nIni adalah halaman percobaan saja untuk website baru beserta seluruh fungsinya.\nIni adalah halaman percobaan saja untuk website baru beserta seluruh fungsinya.\nIni adalah halaman percobaan saja untuk website baru beserta seluruh fungsinya.\nIni adalah halaman percobaan saja untuk website baru beserta seluruh fungsinya.\nIni adalah halaman percobaan saja untuk website baru beserta seluruh fungsinya.\n","font_size":"text-sm","align":"center","text_color":"#666666"}',1,1,'6c3ja2xous');
INSERT INTO "frontpage_widgets" ("id","widget_type","title","content_json","display_order","is_active","page_id") VALUES(1000003,'brand_grid','NEW BRAND GRID','{"brands":[]}',2,1,'6c3ja2xous');
INSERT INTO "frontpage_widgets" ("id","widget_type","title","content_json","display_order","is_active","page_id") VALUES(1000005,'countdown_widget','Flash Sale','{"end_time":"2026-03-10T08:55","expired_text":"OFFER EXPIRED"}',4,1,'6c3ja2xous');
INSERT INTO "frontpage_widgets" ("id","widget_type","title","content_json","display_order","is_active","page_id") VALUES(1000006,'header_widget','HEADER WIDGET','{"logo":"","favicon":"","show_search":true,"show_cart":true,"links":[]}',0,1,'6c3ja2xous');
INSERT INTO "frontpage_widgets" ("id","widget_type","title","content_json","display_order","is_active","page_id") VALUES(1000007,'header_widget','Main Site Navigation','{"logo":"https://cdn.visoeluxury.com/1772981412625-visoeluxury.png","logo_desktop":"https://cdn.visoeluxury.com/1772981412625-visoeluxury.png","logo_width_desktop":"180px","logo_mobile":"https://cdn.visoeluxury.com/1773004820369-visoeluxicon.png","logo_width_mobile":"45px","favicon":"https://cdn.visoeluxury.com/1773004820369-visoeluxicon.png","top_bar_text":"Authentic Luxury Goods Only","show_cart":true,"show_search":true,"menu":[{"title":"Bags","url":"#","columns":[{"heading":"Column 1","links":[{"name":"About","url":"/about"},{"name":"New Link","url":"/test"},{"name":"New Link","url":"/tes"}]},{"heading":"Column 2","links":[{"name":"New Link","url":"/testing"},{"name":"New Link","url":"/testing"},{"name":"New Link","url":"/testing"}]}]},{"title":"Mega Menu","url":"#","columns":[{"heading":"New Column","links":[{"name":"New Link","url":"/test"},{"name":"New Link","url":"/test"},{"name":"New Link","url":"/test"}]}]}]}',0,1,'home');
CREATE TABLE store_settings (     id TEXT PRIMARY KEY,     config_json TEXT NOT NULL,     updated_at DATETIME DEFAULT CURRENT_TIMESTAMP );
INSERT INTO "store_settings" ("id","config_json","updated_at") VALUES('GLOBAL','{"store_name":"Visoe Luxury","contact_email":"cs@visoeluxury.com","whatsapp_number":"628131119285","instagram_url":"","shipping_policy":""}','2026-03-07 21:19:50');
CREATE TABLE media_assets (     id TEXT PRIMARY KEY,     file_name TEXT NOT NULL,     file_key TEXT NOT NULL,     public_url TEXT NOT NULL,     size_kb REAL NOT NULL,     created_at DATETIME DEFAULT CURRENT_TIMESTAMP );
INSERT INTO "media_assets" ("id","file_name","file_key","public_url","size_kb","created_at") VALUES('3urh5w23hbn','visoeluxury.png','https://cdn.visoeluxury.com/1772981412625-visoeluxury.png','https://cdn.visoeluxury.com/1772981412625-visoeluxury.png',128.07421875,'2026-03-08 14:50:12');
INSERT INTO "media_assets" ("id","file_name","file_key","public_url","size_kb","created_at") VALUES('c4ycoxl1e5k','visoeluxicon.png','https://cdn.visoeluxury.com/1773004820369-visoeluxicon.png','https://cdn.visoeluxury.com/1773004820369-visoeluxicon.png',289.873046875,'2026-03-08 21:20:20');
CREATE TABLE pages (     id TEXT PRIMARY KEY,     title TEXT NOT NULL,     slug TEXT NOT NULL UNIQUE,     template_type TEXT NOT NULL DEFAULT 'standard',     content TEXT,     created_at DATETIME DEFAULT CURRENT_TIMESTAMP,     updated_at DATETIME DEFAULT CURRENT_TIMESTAMP );
INSERT INTO "pages" ("id","title","slug","template_type","content","created_at","updated_at") VALUES('6c3ja2xous','About Us','about','canvas','<p><br></p>','2026-03-08 00:44:19','2026-03-08 01:35:16');
DELETE FROM sqlite_sequence;
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('frontpage_widgets',1000007);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_active ON products(is_active);
CREATE TRIGGER update_users_time 
AFTER UPDATE ON users
BEGIN
    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
CREATE TRIGGER update_orders_time 
AFTER UPDATE ON orders
BEGIN
    UPDATE orders SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
