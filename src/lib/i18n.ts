/**
 * Bilingual foundation for the PUBLIC site of Hiba Optics.
 * Arabic ('ar') is the default and primary language; English ('en') is secondary.
 * The admin panel is intentionally Arabic-only and does NOT use this layer.
 *
 * UI strings live in the `UI` dictionary below (keyed, e.g. `hero.headline.l1`).
 * DB CONTENT (product names, branch fields, …) is NOT translated here — it has
 * its own _ar/_en columns; use `localize()` to pick the right one per language.
 */

export type Lang = 'ar' | 'en'

export const DEFAULT_LANG: Lang = 'ar'

export const LANG_DIR: Record<Lang, 'rtl' | 'ltr'> = {
  ar: 'rtl',
  en: 'ltr',
}

/** localStorage key for the persisted language choice. */
export const LANG_STORAGE_KEY = 'hiba_lang'

/** Brand name in both languages. The Latin wordmark stays "Hiba Optics". */
export const BRAND = {
  ar: 'مركز هبة الطبي للبصريات',
  en: 'Hiba Optics',
  wordmark: 'Hiba Optics',
} as const

type Entry = { ar: string; en: string }

/**
 * UI interface strings (header / footer / homepage — first pass).
 * Numbers stay Western digits (0-9) in both languages.
 */
export const UI = {
  // ---- Header ----
  'header.search': { ar: 'بحث', en: 'Search' },
  'header.favorites': { ar: 'المفضلة', en: 'Favorites' },
  'header.cart': { ar: 'السلة', en: 'Cart' },
  'header.menu': { ar: 'القائمة', en: 'Menu' },
  'header.close': { ar: 'إغلاق', en: 'Close' },
  'header.whatsapp': { ar: 'تواصل عبر واتساب', en: 'Chat on WhatsApp' },
  'header.language': { ar: 'اللغة', en: 'Language' },

  // ---- Footer ----
  'footer.tagline': {
    ar: 'نظارات طبية وشمسية · فحص نظر شامل · براندات عالمية',
    en: 'Prescription & sunglasses · Comprehensive eye exams · Global brands',
  },
  'footer.quickLinks': { ar: 'روابط سريعة', en: 'Quick Links' },
  'footer.branches': { ar: 'الفروع', en: 'Branches' },
  'footer.rights': { ar: 'جميع الحقوق محفوظة', en: 'All rights reserved' },
  'footer.credit': { ar: 'تصميم وتطوير Zaytoun', en: 'Designed & developed by Zaytoun' },

  // ---- Shared ----
  'cta.bookExam': { ar: 'احجز فحص نظر', en: 'Book an Eye Exam' },
  'common.whyHiba': { ar: 'لماذا هبة', en: 'Why Hiba' },
  'common.learnMore': { ar: 'اعرف المزيد', en: 'Learn more' },

  // ---- Hero ----
  'hero.eyebrow': { ar: 'مركز هبة الطبي للبصريات', en: 'Hiba Optical Center' },
  'hero.headline.l1': { ar: 'رؤية أوضح،', en: 'Clearer vision,' },
  'hero.headline.l2pre': { ar: 'إطلالة ', en: 'a finer ' },
  'hero.headline.l2hl': { ar: 'أرقى', en: 'look' },
  'hero.subhead': {
    ar: 'نظارات طبية وشمسية من أرقى البراندات العالمية، وفحص نظر شامل في نابلس وحوارة.',
    en: "Prescription and sunglasses from the world's finest brands, plus comprehensive eye exams in Nablus and Huwara.",
  },
  'hero.cta.shop': { ar: 'تسوّق النظارات', en: 'Shop Eyewear' },
  'hero.trust.1': { ar: 'براندات أصلية', en: 'Authentic brands' },
  'hero.trust.2': { ar: 'فحص نظر شامل', en: 'Comprehensive eye exam' },
  'hero.trust.3': { ar: 'فرعان في نابلس وحوارة', en: 'Two branches in Nablus & Huwara' },

  // ---- Brand statement band ----
  'brandStmt.headline.pre': {
    ar: 'نؤمن أن النظارة ليست مجرّد عدسة، بل طريقتك في رؤية العالم ',
    en: "We believe glasses aren't just a lens — they're how you see the world ",
  },
  'brandStmt.headline.hl': { ar: 'بوضوح', en: 'clearly' },
  'brandStmt.support': {
    ar: 'من فحص النظر الدقيق إلى أرقى البراندات العالمية — نهتم بكل تفصيل حتى ترى وتُرى بأفضل صورة.',
    en: "From precise eye exams to the world's finest brands — we care about every detail so you see, and are seen, at your best.",
  },

  // ---- Services ----
  'services.heading': { ar: 'خدماتنا', en: 'Our Services' },
  'services.eyeExam.title': { ar: 'فحص نظر شامل', en: 'Comprehensive Eye Exam' },
  'services.eyeExam.desc': {
    ar: 'فحص دقيق بأحدث الأجهزة لتحديد مقاسك بدقة.',
    en: 'A precise exam with modern equipment to pinpoint your prescription.',
  },
  'services.sunglasses.title': { ar: 'نظارات شمسية', en: 'Sunglasses' },
  'services.sunglasses.desc': {
    ar: 'أرقى البراندات العالمية وإصدارات محدودة.',
    en: 'The finest global brands and limited editions.',
  },
  'services.contacts.title': { ar: 'عدسات لاصقة', en: 'Contact Lenses' },
  'services.contacts.desc': {
    ar: 'عدسات مريحة وآمنة لكل الاستخدامات.',
    en: 'Comfortable, safe lenses for every use.',
  },
  'services.kids.title': { ar: 'نظارات أطفال', en: "Kids' Glasses" },
  'services.kids.desc': {
    ar: 'إطارات مرنة ومتينة مصممة خصيصاً للأطفال.',
    en: 'Flexible, durable frames made just for kids.',
  },

  // ---- Branches teaser ----
  'branches.heading': { ar: 'زورونا', en: 'Visit Us' },
  'branches.sub': { ar: 'فرعان لخدمتكم', en: 'Two branches to serve you' },
  'branches.whatsapp': { ar: 'واتساب', en: 'WhatsApp' },
  'branches.call': { ar: 'الاتصال', en: 'Call' },
  'branches.map.pre': { ar: 'خريطة كل فرع في ', en: "Find each branch's map on the " },
  'branches.map.link': { ar: 'صفحة الفروع', en: 'branches page' },

  // ---- Closing CTA ----
  'closing.heading': {
    ar: 'جاهز لإطلالة أوضح وأناقة أرقى؟',
    en: 'Ready for clearer vision and finer style?',
  },
  'closing.sub': {
    ar: 'اكتشف مجموعتنا من أرقى البراندات، أو احجز فحص نظر شامل مع مختصينا.',
    en: 'Explore our collection of top brands, or book a comprehensive eye exam with our specialists.',
  },
  'closing.shop': { ar: 'تسوّق الآن', en: 'Shop Now' },

  // ---- Featured products ----
  'featured.eyebrow': { ar: 'مختارة بعناية', en: 'Handpicked' },
  'featured.heading': { ar: 'نظارات مميزة', en: 'Featured Eyewear' },
  'featured.sub': { ar: 'أبرز اختياراتنا لك.', en: 'Our top picks for you.' },

  // ---- Shop: finder entry ----
  'shop.finder.title': { ar: 'اعثر على إطارك', en: 'Find your frame' },
  'shop.finder.subtitle': {
    ar: ' — إطارات تناسب شكل وجهك',
    en: ' — frames that suit your face shape',
  },
  'shop.finder.start': { ar: 'ابدأ', en: 'Start' },

  // ---- Shop: search + sort ----
  'shop.search.placeholder': { ar: 'ابحث بالاسم أو الموديل…', en: 'Search by name or model…' },
  'shop.search.aria': { ar: 'بحث', en: 'Search' },
  'shop.search.clear': { ar: 'مسح البحث', en: 'Clear search' },
  'shop.search.chip': { ar: 'بحث: {q}', en: 'Search: {q}' },
  'shop.filters': { ar: 'الفلاتر', en: 'Filters' },
  'shop.apply': { ar: 'تطبيق', en: 'Apply' },
  'shop.sort.label': { ar: 'ترتيب', en: 'Sort' },
  'shop.sort.newest': { ar: 'الأحدث', en: 'Newest' },
  'shop.sort.price_asc': { ar: 'السعر: من الأقل للأعلى', en: 'Price: low to high' },
  'shop.sort.price_desc': { ar: 'السعر: من الأعلى للأقل', en: 'Price: high to low' },
  'shop.sort.featured': { ar: 'المميزة أولاً', en: 'Featured first' },

  // ---- Shop: category / brand / audience filters ----
  'shop.cat.all': { ar: 'الكل', en: 'All' },
  'shop.cat.sunglasses': { ar: 'شمسية', en: 'Sunglasses' },
  'shop.cat.optical': { ar: 'طبية', en: 'Optical' },
  'shop.cat.contact_lenses': { ar: 'عدسات لاصقة', en: 'Contact lenses' },
  'shop.cat.accessories': { ar: 'إكسسوارات', en: 'Accessories' },
  'shop.brand.all': { ar: 'كل البراندات', en: 'All brands' },
  'shop.brand.label': { ar: 'البراند', en: 'Brand' },
  'shop.aud.label': { ar: 'الفئة المستهدفة', en: 'Audience' },
  'shop.aud.all': { ar: 'الكل', en: 'All' },
  'shop.aud.men': { ar: 'رجالي', en: 'Men' },
  'shop.aud.women': { ar: 'نسائي', en: 'Women' },
  'shop.aud.unisex': { ar: 'للجنسين', en: 'Unisex' },
  'shop.aud.kids': { ar: 'أطفال', en: 'Kids' },

  // ---- Shop: price / availability / color ----
  'shop.price.label': { ar: 'السعر:', en: 'Price:' },
  'shop.price.min': { ar: 'من', en: 'Min' },
  'shop.price.max': { ar: 'إلى', en: 'Max' },
  'shop.price.minAria': { ar: 'أقل سعر', en: 'Minimum price' },
  'shop.price.maxAria': { ar: 'أعلى سعر', en: 'Maximum price' },
  'shop.price.under': { ar: 'أقل من {x}', en: 'Under {x}' },
  'shop.price.over': { ar: 'أكثر من {x}', en: 'Over {x}' },
  'shop.avail.label': { ar: 'التوفّر', en: 'Availability' },
  'shop.avail.inStock': { ar: 'المتوفر فقط', en: 'In stock only' },
  'shop.color.label': { ar: 'اللون', en: 'Color' },

  // ---- Shop: results + chips + states ----
  'shop.results': { ar: '{n} نتيجة', en: '{n} results' },
  'shop.clearAll': { ar: 'مسح الكل', en: 'Clear all' },
  'shop.chip.remove': { ar: 'إزالة {label}', en: 'Remove {label}' },
  'shop.empty.title': { ar: 'لا توجد منتجات مطابقة', en: 'No matching products' },
  'shop.empty.clear': { ar: 'مسح الفلاتر', en: 'Clear filters' },
  'shop.error': { ar: 'تعذّر تحميل المنتجات', en: "Couldn't load products" },
  'shop.drawer.title': { ar: 'الفلاتر', en: 'Filters' },

  // ---- Product card (shared) ----
  'card.consultation': { ar: 'بحاجة لفحص نظر', en: 'Eye exam required' },
  'card.outOfStock': { ar: 'غير متوفر', en: 'Out of stock' },
  'card.reserve': { ar: 'احجز', en: 'Reserve' },
  'card.add': { ar: 'أضف للسلة', en: 'Add to cart' },
  'card.added': { ar: 'تمت الإضافة ✓', en: 'Added ✓' },

  // ---- Product detail ----
  'pd.breadcrumb.aria': { ar: 'مسار التنقل', en: 'Breadcrumb' },
  'pd.breadcrumb.home': { ar: 'الرئيسية', en: 'Home' },
  'pd.reviewsCount': { ar: '{n} تقييم', en: '{n} reviews' },
  'pd.save': { ar: 'وفّر {x}٪', en: 'Save {x}%' },
  'pd.color': { ar: 'اللون', en: 'Color' },
  'pd.outOfStockParen': { ar: '(غير متوفر)', en: '(out of stock)' },
  'pd.qty': { ar: 'الكمية', en: 'Quantity' },
  'pd.qty.dec': { ar: 'إنقاص الكمية', en: 'Decrease quantity' },
  'pd.qty.inc': { ar: 'زيادة الكمية', en: 'Increase quantity' },
  'pd.outOfStock': { ar: 'غير متوفر', en: 'Out of stock' },
  'pd.outOfStockColor': { ar: 'غير متوفر بهذا اللون', en: 'Out of stock in this color' },
  'pd.consultation': {
    ar: 'هذا إطار طبي يحتاج فحص نظر وتركيب عدسات — سنتواصل معك لإتمام الفحص واختيار العدسات.',
    en: "This is a prescription frame that needs an eye exam and lens fitting — we'll contact you to complete the exam and choose your lenses.",
  },
  'pd.addToCart': { ar: 'أضف إلى السلة', en: 'Add to Cart' },
  'pd.reserve': { ar: 'احجز الآن', en: 'Reserve Now' },
  'pd.added': { ar: 'تمت الإضافة ✓', en: 'Added ✓' },
  'pd.addedReserve': { ar: 'تمت الإضافة للحجز ✓', en: 'Added to reservation ✓' },
  'pd.trust.authentic': { ar: 'منتج أصلي', en: 'Authentic product' },
  'pd.trust.quality': { ar: 'ضمان الجودة', en: 'Quality guarantee' },
  'pd.trust.fitting': { ar: 'فحص وتركيب في المحل', en: 'In-store exam & fitting' },
  'pd.reviews.heading': { ar: 'التقييمات', en: 'Reviews' },
  'pd.reviews.none': { ar: 'لا توجد تقييمات بعد', en: 'No reviews yet' },
  'pd.featured': { ar: 'الأكثر مبيعاً', en: 'Best seller' },
  'pd.notfound': { ar: 'المنتج غير موجود', en: 'Product not found' },
  'pd.backToShop': { ar: 'العودة إلى المتجر', en: 'Back to shop' },
  'pd.error': { ar: 'تعذّر تحميل المنتج', en: "Couldn't load product" },
  'pd.gallery.aria': { ar: 'معرض صور المنتج', en: 'Product image gallery' },
  'pd.gallery.next': { ar: 'الصورة التالية', en: 'Next image' },
  'pd.gallery.prev': { ar: 'الصورة السابقة', en: 'Previous image' },
  'pd.gallery.thumb': { ar: 'صورة {n}', en: 'Image {n}' },
  'pd.gallery.magnifyHint': { ar: 'مرّر مؤشر الفأرة للتكبير', en: 'Hover to zoom' },
  'pd.lightbox.aria': { ar: 'عرض الصورة', en: 'Image viewer' },

  // ---- Finder ----
  'finder.eyebrow': { ar: 'مكتشف الإطارات', en: 'Frame Finder' },
  'finder.intro.title': {
    ar: 'اعثر على الإطار المثالي لوجهك',
    en: 'Find the perfect frame for your face',
  },
  'finder.intro.desc': {
    ar: 'أجب عن ثلاثة أسئلة قصيرة ودعنا نقترح لك الإطارات التي تناسب شكل وجهك وذوقك.',
    en: "Answer three quick questions and we'll suggest frames that suit your face shape and taste.",
  },
  'finder.start': { ar: 'ابدأ', en: 'Start' },
  'finder.step': { ar: 'الخطوة {n} من {total}', en: 'Step {n} of {total}' },
  'finder.back': { ar: 'رجوع', en: 'Back' },
  'finder.skip': { ar: 'تخطّي', en: 'Skip' },
  'finder.q1': { ar: 'ما شكل وجهك؟', en: "What's your face shape?" },
  'finder.q1.sub': { ar: 'اختر الشكل الأقرب لملامح وجهك.', en: 'Pick the shape closest to your features.' },
  'finder.face.oval': { ar: 'بيضاوي', en: 'Oval' },
  'finder.face.round': { ar: 'دائري', en: 'Round' },
  'finder.face.square': { ar: 'مربّع', en: 'Square' },
  'finder.face.heart': { ar: 'قلب', en: 'Heart' },
  'finder.face.long': { ar: 'طويل', en: 'Long' },
  'finder.notSure': { ar: 'غير متأكد؟', en: 'Not sure?' },
  'finder.tip': {
    ar: '',
    en: 'Stand in front of a mirror and look at the widest part of your face: if your forehead is wider and narrows toward the chin, your face is heart-shaped; if the forehead and jaw are equally wide with clear angles, it’s square; if the width and length are similar with soft curves, it’s round; if it’s longer than it is wide, it’s long; and if it’s balanced and slightly longer than it is wide, it’s oval.',
  },
  'finder.q2': { ar: 'أي نوع تفضّل؟', en: 'Which type do you prefer?' },
  'finder.q2.sub': {
    ar: 'اختر نوع النظارة الذي تبحث عنه.',
    en: "Choose the type of eyewear you're looking for.",
  },
  'finder.q3': { ar: 'لمن؟', en: 'Who is it for?' },
  'finder.q3.sub': { ar: 'اختياري — يمكنك التخطّي.', en: 'Optional — you can skip.' },
  'finder.results.suggested': { ar: 'منتجات مقترحة', en: 'Suggested products' },
  'finder.results.broadenedNote': {
    ar: 'لم نجد تطابقاً دقيقاً وفق اختياراتك، إليك اقتراحات من مجموعتنا.',
    en: "We couldn't find an exact match for your choices — here are some suggestions from our collection.",
  },
  'finder.count': { ar: '{n} إطار', en: '{n} frames' },
  'finder.empty': { ar: 'لا توجد إطارات متاحة حالياً', en: 'No frames available right now' },
  'finder.restart': { ar: 'أعد الاختبار', en: 'Restart quiz' },
  'finder.browseAll': { ar: 'تصفّح كل النظارات', en: 'Browse all eyewear' },
  'finder.fab': { ar: 'اعثر على إطارك', en: 'Find Your Frame' },
  'finder.close': { ar: 'إغلاق', en: 'Close' },

  // ---- Shared (pass 3) ----
  'common.browseShop': { ar: 'تصفّح المتجر', en: 'Browse the shop' },
  'common.backHome': { ar: 'العودة للرئيسية', en: 'Back to home' },
  'common.backShop': { ar: 'العودة للمتجر', en: 'Back to shop' },
  'common.whatsappContact': { ar: 'تواصل معنا على واتساب', en: 'Contact us on WhatsApp' },

  // ---- Shared form fields + validation ----
  'form.name': { ar: 'الاسم الكامل', en: 'Full name' },
  'form.phoneWa': { ar: 'رقم الهاتف / واتساب', en: 'Phone / WhatsApp' },
  'form.notes': { ar: 'ملاحظات (اختياري)', en: 'Notes (optional)' },
  'form.chooseBranch': { ar: 'اختر الفرع', en: 'Choose a branch' },
  'form.err.name': { ar: 'الرجاء إدخال الاسم الكامل', en: 'Please enter your full name' },
  'form.err.phone': { ar: 'أدخل رقم هاتف صحيح', en: 'Enter a valid phone number' },
  'form.err.branch': { ar: 'الرجاء اختيار الفرع', en: 'Please choose a branch' },

  // ---- Cart ----
  'cart.title': { ar: 'السلة', en: 'Cart' },
  'cart.empty': { ar: 'سلتك فارغة', en: 'Your cart is empty' },
  'cart.remove': { ar: 'إزالة', en: 'Remove' },
  'cart.qtyDec': { ar: 'إنقاص الكمية', en: 'Decrease quantity' },
  'cart.qtyInc': { ar: 'زيادة الكمية', en: 'Increase quantity' },
  'cart.coordinated': { ar: 'يُنسّق عند الحجز', en: 'Arranged at booking' },
  'cart.groupShop': { ar: 'سلة الشراء', en: 'Shopping cart' },
  'cart.groupReserve': { ar: 'طلبات الحجز · بحاجة لفحص نظر', en: 'Reservation items · eye exam required' },
  'cart.reserveNote': {
    ar: 'هذه إطارات طبية — سنتواصل معك لتحديد موعد الفحص واختيار العدسات، ولا تُحتسب ضمن المجموع الآن.',
    en: "These are prescription frames — we'll contact you to schedule the exam and choose lenses; they aren't included in the total yet.",
  },
  'cart.reserveBadge.pre': { ar: 'لديك', en: 'You have' },
  'cart.reserveBadge.post': {
    ar: 'قطعة بحاجة لفحص نظر — سنتواصل معك بخصوصها.',
    en: "item(s) that need an eye exam — we'll be in touch about them.",
  },
  'cart.summary': { ar: 'ملخص الطلب', en: 'Order summary' },
  'cart.subtotal': { ar: 'المجموع الفرعي', en: 'Subtotal' },
  'cart.deliveryNote': { ar: 'تُحسب رسوم التوصيل عند إتمام الطلب.', en: 'Delivery fees are calculated at checkout.' },
  'cart.checkout': { ar: 'إتمام الطلب', en: 'Checkout' },
  'cart.continue': { ar: 'متابعة التسوق', en: 'Continue shopping' },

  // ---- Checkout ----
  'checkout.title': { ar: 'إتمام الطلب', en: 'Checkout' },
  'checkout.fulfillment': { ar: 'طريقة الاستلام', en: 'Fulfillment method' },
  'checkout.delivery': { ar: 'توصيل', en: 'Delivery' },
  'checkout.pickup': { ar: 'استلام من الفرع', en: 'Pickup from branch' },
  'checkout.address': { ar: 'العنوان', en: 'Address' },
  'checkout.city': { ar: 'المدينة', en: 'City' },
  'checkout.payment': { ar: 'طريقة الدفع: الدفع عند الاستلام', en: 'Payment: Cash on delivery' },
  'checkout.consultInfo': {
    ar: 'يحتوي طلبك على إطارات طبية بحاجة لفحص نظر — سنتواصل معك لتحديد موعد الفحص واختيار العدسات قبل التسليم.',
    en: "Your order includes prescription frames that need an eye exam — we'll contact you to schedule the exam and choose lenses before delivery.",
  },
  'checkout.summary': { ar: 'ملخص الطلب', en: 'Order summary' },
  'checkout.subtotal': { ar: 'المجموع الفرعي', en: 'Subtotal' },
  'checkout.deliveryFee': { ar: 'رسوم التوصيل', en: 'Delivery fee' },
  'checkout.total': { ar: 'الإجمالي', en: 'Total' },
  'checkout.submit': { ar: 'تأكيد الطلب', en: 'Confirm order' },
  'checkout.submitting': { ar: 'جاري التأكيد…', en: 'Confirming…' },
  'checkout.backToCart': { ar: 'الرجوع إلى السلة', en: 'Back to cart' },
  'checkout.err.address': { ar: 'الرجاء إدخال العنوان', en: 'Please enter your address' },
  'checkout.err.city': { ar: 'الرجاء إدخال المدينة', en: 'Please enter your city' },
  'checkout.err.submit': {
    ar: 'تعذّر تأكيد الطلب، يرجى المحاولة مرة أخرى.',
    en: "Couldn't confirm your order, please try again.",
  },

  // ---- Order success ----
  'ok.title': { ar: 'شكراً لك! تم استلام طلبك ✓', en: 'Thank you! Your order has been received ✓' },
  'ok.orderNo': { ar: 'رقم الطلب', en: 'Order number' },
  'ok.contactLine': {
    ar: 'سنتواصل معك على الرقم الذي أدخلته لتأكيد الطلب وترتيب التوصيل/الاستلام.',
    en: "We'll contact you on the number you entered to confirm your order and arrange delivery/pickup.",
  },
  // Additional line shown only when the order includes consultation/reserve items.
  'ok.contactLineConsult': {
    ar: 'وسنحدّد معك موعد فحص النظر لإتمام الإطارات الطبية.',
    en: "And we'll schedule your eye exam to complete the prescription frames.",
  },
  'ok.none': { ar: 'لا يوجد طلب لعرضه.', en: 'No order to show.' },

  // ---- Booking ----
  'book.eyebrow': { ar: 'احجز موعدك', en: 'Book your appointment' },
  'book.title': { ar: 'احجز فحص نظر', en: 'Book an eye exam' },
  'book.intro': {
    ar: 'فحص دقيق بأحدث الأجهزة — اختر الفرع والوقت المناسب لك وسنتواصل لتأكيد الموعد.',
    en: "A precise exam with modern equipment — choose the branch and time that suit you and we'll be in touch to confirm.",
  },
  'book.service': { ar: 'نوع الخدمة', en: 'Service type' },
  'book.service.eye_exam': { ar: 'فحص نظر', en: 'Eye exam' },
  'book.service.glasses_consult': { ar: 'استشارة نظارة', en: 'Glasses consultation' },
  'book.service.general': { ar: 'استفسار عام', en: 'General inquiry' },
  'book.branch': { ar: 'الفرع', en: 'Branch' },
  'book.date': { ar: 'التاريخ المفضل (اختياري)', en: 'Preferred date (optional)' },
  'book.time': { ar: 'الوقت المفضل (اختياري)', en: 'Preferred time (optional)' },
  'book.time.optional': { ar: 'اختياري', en: 'Optional' },
  'book.time.morning': { ar: 'صباحاً', en: 'Morning' },
  'book.time.noon': { ar: 'ظهراً', en: 'Noon' },
  'book.time.evening': { ar: 'مساءً', en: 'Evening' },
  'book.submit': { ar: 'تأكيد الحجز', en: 'Confirm booking' },
  'book.submitting': { ar: 'جاري الحجز…', en: 'Booking…' },
  'book.err.submit': {
    ar: 'تعذّر تأكيد الحجز، يرجى المحاولة مرة أخرى.',
    en: "Couldn't confirm your booking, please try again.",
  },
  'book.why': { ar: 'لماذا هبة؟', en: 'Why Hiba?' },
  'book.reassure.1': { ar: 'فحص دقيق بأحدث الأجهزة', en: 'A precise exam with modern equipment' },
  'book.reassure.2': { ar: 'فرعان في نابلس وحوارة', en: 'Two branches in Nablus & Huwara' },
  'book.reassure.3': { ar: 'سنتواصل معك لتأكيد الموعد', en: "We'll contact you to confirm the appointment" },

  // ---- Booking success ----
  'bk.title': { ar: 'تم استلام طلب الحجز ✓', en: 'Your booking request has been received ✓' },
  'bk.bookingNo': { ar: 'رقم الحجز', en: 'Booking number' },
  'bk.contactLine': {
    ar: 'سنتواصل معك على الرقم الذي أدخلته لتأكيد الموعد.',
    en: "We'll contact you on the number you entered to confirm the appointment.",
  },
  'bk.none': { ar: 'لا يوجد حجز لعرضه.', en: 'No booking to show.' },

  // ---- Branches page ----
  'branches.pageEyebrow': { ar: 'زورونا', en: 'Visit Us' },
  'branches.pageTitle': { ar: 'فروعنا', en: 'Our branches' },
  'branches.pageSub': { ar: 'فرعان لخدمتكم في نابلس وحوارة', en: 'Two branches to serve you in Nablus & Huwara' },
  'branches.callBtn': { ar: 'اتصال', en: 'Call' },
  'branches.directions': { ar: 'الاتجاهات', en: 'Directions' },
  'branches.empty': { ar: 'سيتم إضافة الفروع قريباً', en: 'Branches will be added soon' },
  'branches.mapTitle': { ar: 'خريطة {name}', en: '{name} map' },

  // ---- Contact ----
  'contact.eyebrow': { ar: 'تواصل معنا', en: 'Contact us' },
  'contact.title': { ar: 'نحن هنا لمساعدتك', en: "We're here to help" },
  'contact.intro': {
    ar: 'أي سؤال عن النظارات أو فحص النظر؟ راسلنا أو زُر أحد فرعينا.',
    en: 'Any question about eyewear or eye exams? Message us or visit one of our branches.',
  },
  'contact.card.whatsapp.title': { ar: 'واتساب', en: 'WhatsApp' },
  'contact.card.whatsapp.line': { ar: 'الأسرع للرد على استفساراتك', en: 'The fastest way to get answers' },
  'contact.card.whatsapp.action': { ar: 'راسلنا الآن', en: 'Message us now' },
  'contact.card.call.title': { ar: 'اتصل بنا', en: 'Call us' },
  'contact.card.call.line': { ar: 'خلال ساعات العمل', en: 'During working hours' },
  'contact.card.visit.title': { ar: 'زورونا', en: 'Visit us' },
  'contact.card.visit.line': { ar: 'فرعان في نابلس وحوارة', en: 'Two branches in Nablus & Huwara' },
  'contact.card.visit.action': { ar: 'صفحة الفروع', en: 'Branches page' },
  'contact.card.hours.title': { ar: 'ساعات العمل', en: 'Working hours' },
  'contact.card.hours.days': { ar: 'السبت - الخميس', en: 'Saturday – Thursday' },
  'contact.card.hours.time': { ar: '9 صباحاً - 8 مساءً', en: '9 AM – 8 PM' },
  'contact.form.title': { ar: 'أرسل لنا رسالة', en: 'Send us a message' },
  'contact.form.name': { ar: 'الاسم', en: 'Name' },
  'contact.form.phone': { ar: 'رقم الهاتف', en: 'Phone number' },
  'contact.form.subject': { ar: 'الموضوع', en: 'Subject' },
  'contact.form.message': { ar: 'الرسالة', en: 'Message' },
  'contact.form.send': { ar: 'إرسال عبر واتساب', en: 'Send via WhatsApp' },
  'contact.subject.product': { ar: 'استفسار عن منتج', en: 'Product inquiry' },
  'contact.subject.booking': { ar: 'حجز فحص نظر', en: 'Book an eye exam' },
  'contact.subject.general': { ar: 'استفسار عام', en: 'General inquiry' },
  'contact.subject.other': { ar: 'أخرى', en: 'Other' },
  'contact.err.name': { ar: 'الرجاء إدخال الاسم', en: 'Please enter your name' },
  'contact.err.phone': { ar: 'الرجاء إدخال رقم الهاتف', en: 'Please enter your phone number' },
  'contact.err.message': { ar: 'الرجاء كتابة رسالتك', en: 'Please write your message' },
  'contact.faq.title': { ar: 'الأسئلة الشائعة', en: 'FAQ' },
  'contact.faq.q1': { ar: 'هل تجرون فحص نظر شامل؟', en: 'Do you offer comprehensive eye exams?' },
  'contact.faq.a1': {
    ar: 'نعم، نوفر فحص نظر دقيق بأحدث الأجهزة في كلا الفرعين.',
    en: 'Yes, we offer precise eye exams with modern equipment at both branches.',
  },
  'contact.faq.q2': { ar: 'كم يستغرق تجهيز النظارة الطبية؟', en: 'How long does it take to prepare prescription glasses?' },
  'contact.faq.a2': {
    ar: 'غالباً من يوم إلى ثلاثة أيام حسب نوع العدسات، وسنبلغك فور جاهزيتها.',
    en: "Usually one to three days depending on the lens type, and we'll let you know as soon as they're ready.",
  },
  'contact.faq.q3': { ar: 'هل جميع النظارات أصلية؟', en: 'Are all your glasses authentic?' },
  'contact.faq.a3': {
    ar: 'نعم، جميع منتجاتنا أصلية من البراندات العالمية المعتمدة.',
    en: 'Yes, all our products are authentic, from certified global brands.',
  },
  'contact.faq.q4': { ar: 'هل تتوفر عدسات لاصقة؟', en: 'Do you offer contact lenses?' },
  'contact.faq.a4': {
    ar: 'نعم، نوفر عدسات لاصقة طبية وتجميلية بأنواع متعددة.',
    en: 'Yes, we offer prescription and cosmetic contact lenses in many types.',
  },
  'contact.faq.q5': { ar: 'هل يوجد خدمة توصيل؟', en: 'Do you offer delivery?' },
  'contact.faq.a5': {
    ar: 'نعم، نوفر توصيل للطلبات مع الدفع عند الاستلام.',
    en: 'Yes, we deliver orders with cash on delivery.',
  },
  'contact.faqMore.pre': { ar: 'لم تجد إجابتك؟', en: "Didn't find your answer?" },
  'contact.faqMore.link': { ar: 'راسلنا على واتساب', en: 'Message us on WhatsApp' },

  // ---- Brands page ----
  'brands.eyebrow': { ar: 'علاماتنا التجارية', en: 'Our brands' },
  'brands.title': { ar: 'براندات عالمية', en: 'Global brands' },
  'brands.sub': { ar: 'نختار لك أرقى الأسماء في عالم النظارات.', en: 'We curate the finest names in eyewear for you.' },
  'brands.products': { ar: 'منتج', en: 'products' },
  'brands.soon': { ar: 'قريباً', en: 'Coming soon' },
  'brands.browse': { ar: 'تصفّح المجموعة', en: 'Browse the collection' },
  'brands.empty': { ar: 'سيتم إضافة البراندات قريباً', en: 'Brands will be added soon' },

  // ---- Favorites ----
  'fav.count': { ar: '{n} منتج في المفضلة', en: '{n} in your favorites' },
  'fav.error': { ar: 'تعذّر تحميل المفضلة', en: "Couldn't load favorites" },
  'fav.empty': { ar: 'لا توجد منتجات في المفضلة بعد', en: 'No favorites yet' },
  'fav.syncError': { ar: 'تعذّرت مزامنة المفضلة، حاول مجدداً', en: "Couldn't sync favorites, try again" },

  // ---- Customer account ----
  'account.menu': { ar: 'حسابي', en: 'My account' },
  'account.login': { ar: 'تسجيل الدخول', en: 'Log in' },
  'account.logout': { ar: 'تسجيل الخروج', en: 'Log out' },
  'account.register': { ar: 'إنشاء حساب', en: 'Create account' },
  'account.account': { ar: 'حسابي', en: 'My account' },
  // Fields
  'account.name': { ar: 'الاسم', en: 'Name' },
  'account.email': { ar: 'البريد الإلكتروني', en: 'Email' },
  'account.password': { ar: 'كلمة المرور', en: 'Password' },
  'account.confirmPassword': { ar: 'تأكيد كلمة المرور', en: 'Confirm password' },
  // Login page
  'account.login.title': { ar: 'تسجيل الدخول', en: 'Log in' },
  'account.login.subtitle': {
    ar: 'ادخل إلى حسابك في مركز هبة للبصريات',
    en: 'Sign in to your Hiba Optics account',
  },
  'account.login.submit': { ar: 'تسجيل الدخول', en: 'Log in' },
  'account.login.noAccount': { ar: 'ليس لديك حساب؟', en: "Don't have an account?" },
  'account.login.registerLink': { ar: 'أنشئ حساباً', en: 'Create one' },
  'account.login.error': {
    ar: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
    en: 'Incorrect email or password.',
  },
  // Register page
  'account.register.title': { ar: 'إنشاء حساب', en: 'Create account' },
  'account.register.subtitle': {
    ar: 'أنشئ حسابك للاستفادة من خدماتنا',
    en: 'Create your account to get started',
  },
  'account.register.submit': { ar: 'إنشاء حساب', en: 'Create account' },
  'account.register.haveAccount': { ar: 'لديك حساب بالفعل؟', en: 'Already have an account?' },
  'account.register.loginLink': { ar: 'سجّل الدخول', en: 'Log in' },
  'account.register.confirm': {
    ar: 'تحقق من بريدك الإلكتروني لتأكيد حسابك.',
    en: 'Check your email to confirm your account.',
  },
  // Validation (Arabic-first, friendly)
  'account.err.nameRequired': { ar: 'الرجاء إدخال الاسم.', en: 'Please enter your name.' },
  'account.err.emailRequired': {
    ar: 'الرجاء إدخال البريد الإلكتروني.',
    en: 'Please enter your email.',
  },
  'account.err.emailInvalid': {
    ar: 'صيغة البريد الإلكتروني غير صحيحة.',
    en: 'Please enter a valid email address.',
  },
  'account.err.passwordRequired': {
    ar: 'الرجاء إدخال كلمة المرور.',
    en: 'Please enter a password.',
  },
  'account.err.passwordShort': {
    ar: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل.',
    en: 'Password must be at least 6 characters.',
  },
  'account.err.passwordMismatch': {
    ar: 'كلمتا المرور غير متطابقتين.',
    en: 'Passwords do not match.',
  },
  'account.err.generic': {
    ar: 'حدث خطأ ما، حاول مرة أخرى.',
    en: 'Something went wrong, please try again.',
  },
  // Account page
  'account.greeting': { ar: 'مرحباً، {name}', en: 'Hello, {name}' },
  'account.soon': {
    ar: 'قريباً: طلباتك السابقة ومنتجاتك المفضّلة.',
    en: 'Coming soon: your past orders and favorite products.',
  },
  'account.orders': { ar: 'طلباتي', en: 'My orders' },
  'account.ordersDesc': {
    ar: 'اطّلع على طلباتك السابقة وحالتها.',
    en: 'View your past orders and their status.',
  },
  'account.profile': { ar: 'بياناتي', en: 'My details' },
  'account.profileDesc': {
    ar: 'حدّث اسمك ورقم هاتفك وعنوانك.',
    en: 'Update your name, phone, and address.',
  },

  // ---- Profile ----
  'profile.title': { ar: 'بياناتي', en: 'My details' },
  'profile.subtitle': {
    ar: 'تُستخدم هذه المعلومات لتعبئة بيانات الطلب تلقائياً.',
    en: 'These details are used to pre-fill your checkout.',
  },
  'profile.name': { ar: 'الاسم', en: 'Name' },
  'profile.phone': { ar: 'رقم الهاتف', en: 'Phone number' },
  'profile.address': { ar: 'العنوان', en: 'Address' },
  'profile.city': { ar: 'المدينة', en: 'City' },
  'profile.email': { ar: 'البريد الإلكتروني', en: 'Email' },
  'profile.save': { ar: 'حفظ', en: 'Save' },
  'profile.saving': { ar: 'جاري الحفظ…', en: 'Saving…' },
  'profile.saved': { ar: 'تم حفظ بياناتك', en: 'Your details were saved' },
  'profile.loadError': { ar: 'تعذّر تحميل بياناتك', en: "Couldn't load your details" },
  'profile.saveError': { ar: 'تعذّر حفظ بياناتك، حاول مجدداً', en: "Couldn't save your details, try again" },
  'profile.err.name': { ar: 'الرجاء إدخال الاسم.', en: 'Please enter your name.' },
  'profile.err.phone': { ar: 'صيغة رقم الهاتف غير صحيحة.', en: 'Please enter a valid phone number.' },
  'checkout.saveToProfile': {
    ar: 'حفظ هذه المعلومات في حسابي',
    en: 'Save these details to my account',
  },

  // ---- Renewal reminder (in-account) ----
  'renewal.title': { ar: 'حان وقت {what}', en: 'Time for {what}' },
  'renewal.default': { ar: 'تجديد عدساتك / فحص نظرك', en: 'your lens renewal / eye exam' },
  'renewal.overdue': { ar: 'تأخّر موعد التجديد', en: 'Your renewal is overdue' },
  'renewal.upcoming': { ar: 'يقترب موعد التجديد', en: 'Your renewal is coming up' },
  'renewal.on': { ar: 'الموعد: {date}', en: 'Due: {date}' },
  'renewal.book': { ar: 'احجز الآن', en: 'Book now' },

  // ---- Order history ----
  'orders.title': { ar: 'طلباتي', en: 'My orders' },
  'orders.count': { ar: '{n} طلب', en: '{n} orders' },
  'orders.empty': { ar: 'لا توجد طلبات سابقة بعد', en: 'No past orders yet' },
  'orders.error': { ar: 'تعذّر تحميل الطلبات', en: "Couldn't load your orders" },
  'orders.total': { ar: 'الإجمالي', en: 'Total' },
  'orders.status.new': { ar: 'جديد', en: 'New' },
  'orders.status.confirmed': { ar: 'مؤكد', en: 'Confirmed' },
  'orders.status.delivered': { ar: 'تم التسليم', en: 'Delivered' },
  'orders.status.cancelled': { ar: 'ملغي', en: 'Cancelled' },
} satisfies Record<string, Entry>

export type UIKey = keyof typeof UI

/** Resolve a UI string key for the given language. */
export function translate(key: UIKey, lang: Lang): string {
  return UI[key][lang]
}

/**
 * Interpolate `{name}` placeholders in a (usually translated) string.
 * e.g. format(t('shop.results'), { n: 12 }) → "12 results".
 * Numbers are stringified as-is (Western digits).
 */
export function format(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) =>
    k in vars ? String(vars[k]) : `{${k}}`,
  )
}

/** Category value → UI key (localized label for filters + breadcrumbs). */
export const CATEGORY_LABEL_KEY = {
  sunglasses: 'shop.cat.sunglasses',
  optical: 'shop.cat.optical',
  contact_lenses: 'shop.cat.contact_lenses',
  accessories: 'shop.cat.accessories',
} satisfies Record<string, UIKey>

/** Audience value → UI key (localized label for filters + chips). */
export const AUDIENCE_LABEL_KEY = {
  men: 'shop.aud.men',
  women: 'shop.aud.women',
  unisex: 'shop.aud.unisex',
  kids: 'shop.aud.kids',
} satisfies Record<string, UIKey>

/**
 * Pick a localized DB field: `${base}_en` when lang='en' (falling back to
 * `${base}_ar` if the English value is empty), otherwise `${base}_ar`.
 * Never returns blank when the Arabic value exists.
 */
export function localize(obj: object | null | undefined, base: string, lang: Lang): string {
  if (!obj) return ''
  const rec = obj as Record<string, unknown>
  const ar = (rec[`${base}_ar`] as string | null | undefined) ?? ''
  if (lang === 'en') {
    const en = (rec[`${base}_en`] as string | null | undefined) ?? ''
    return en.trim() !== '' ? en : ar
  }
  return ar
}
