// Datos de las cabañas — basados en la información oficial de Pirates Cove Coastal Cottages.
export const BOOK_URL = 'https://hotels.cloudbeds.com/en/reservation/wxF3CZ?currency=usd';
export const PHONE = '+13525435141';
export const PET_FEE = 10;

export const VIEW = {
  water:   { label: 'Vista al agua',          short: 'Al agua' },
  partial: { label: 'Vista parcial al agua',  short: 'Vista parcial' },
  court:   { label: 'Frente al patio',        short: 'Patio' }
};

// layout: studio | suite | two  · porch: deck | screen | detached
// pos: coordenadas en el plano del complejo (m). face: punto hacia el que mira la fachada.
export const COTTAGES = [
  { n: 1, price: 169, guests: 4, beds: 2, bedsLabel: '2 dormitorios', baths: 1, view: 'partial', porch: 'deck', layout: 'two',
    color: '#9cc7dc', accent: '#2f6f8f', roof: '#c7ccd0',
    tagline: 'La casa familiar del complejo',
    desc: 'Espacio para toda la familia en esta cabaña de dos dormitorios, con cocina, sala y comedor independientes.',
    rooms: ['Dos dormitorios privados (una cama queen y una king)', 'Un baño con ducha', 'Cocina equipada', 'Sala y comedor', 'Terraza cubierta con vista parcial al agua'],
    beddings: ['Queen', 'King'], bath: 'Ducha',
    pos: [-15, -17], face: [2, 0], tags: ['family', 'deck'] },
  { n: 2, price: 119, guests: 2, beds: 1, bedsLabel: 'Estudio', baths: 1, view: 'court', porch: 'deck', layout: 'studio',
    color: '#f1dd8f', accent: '#b5862e', roof: '#c9c3b5',
    tagline: 'Rincón soleado frente al patio',
    desc: 'Todo lo necesario para disfrutar la belleza de Cedar Key, a pocos pasos del patio central y sus mesas bajo los robles.',
    rooms: ['Una cama queen', 'Un baño con bañera y ducha', 'Cocina equipada', 'Pequeño loveseat'],
    beddings: ['Queen'], bath: 'Bañera y ducha',
    pos: [-20, -3], face: [2, 0], tags: ['couple', 'deck'] },
  { n: 3, price: 119, guests: 2, beds: 1, bedsLabel: 'Estudio', baths: 1, view: 'court', porch: 'deck', layout: 'studio',
    color: '#a9dcc6', accent: '#3c8a6c', roof: '#c3cbc6',
    tagline: 'Escapada tranquila para dos',
    desc: 'Una cabaña encantadora, perfecta para una escapada tranquila de a dos, rodeada de jardín y sombra de robles.',
    rooms: ['Una cama queen', 'Un baño con bañera y ducha', 'Cocina equipada', 'Sofá pequeño'],
    beddings: ['Queen'], bath: 'Bañera y ducha',
    pos: [-17, 11], face: [2, 0], tags: ['couple', 'deck'] },
  { n: 4, price: 139, guests: 2, beds: 1, bedsLabel: 'Estudio', baths: 1, view: 'water', porch: 'screen', layout: 'studio',
    color: '#6cc7c0', accent: '#1f6f6a', roof: '#c3cdd0',
    tagline: 'Porche con mosquitero sobre el agua',
    desc: 'El porche con mosquitero será su rincón favorito: lea un libro u observe las aves sobre el agua.',
    rooms: ['Una cama queen', 'Un baño con bañera y ducha', 'Cocina equipada', 'Área de estar', 'Terraza con mosquitero sobre el agua'],
    beddings: ['Queen'], bath: 'Bañera y ducha',
    pos: [17, -22], face: [60, -24], tags: ['couple', 'water', 'screen'] },
  { n: 5, price: 139, guests: 3, beds: 1, bedsLabel: 'Estudio + sofá cama', baths: 1, view: 'water', porch: 'screen', layout: 'studio',
    color: '#c6b8de', accent: '#6a5a92', roof: '#c8c9d2',
    tagline: 'Amaneceres sobre la bahía',
    desc: 'Comience el día con amaneceres y vistas impresionantes al agua desde su terraza con mosquitero.',
    rooms: ['Cama queen y loveseat con sofá cama (individual)', 'Un baño con bañera y ducha', 'Cocina equipada', 'Área de estar', 'Terraza con mosquitero sobre el agua'],
    beddings: ['Queen', 'Sofá cama individual'], bath: 'Bañera y ducha',
    pos: [19, -10], face: [60, -10], tags: ['couple', 'water', 'screen'] },
  { n: 6, price: 159, guests: 5, beds: 2, bedsLabel: '2 dormitorios', baths: 1, view: 'water', porch: 'screen', layout: 'two',
    color: '#a9c792', accent: '#4f7a3a', roof: '#c6cbc4',
    tagline: 'Terraza privada frente al agua',
    desc: 'Terraza privada con vista al agua en esta cabaña de dos dormitorios, ideal para sus vacaciones en Cedar Key.',
    rooms: ['Una cama queen (área principal)', 'Una cama queen y loveseat con sofá cama (individual)', 'Un baño con bañera y ducha', 'Cocina equipada', 'Terraza con mosquitero sobre el agua'],
    beddings: ['Queen', 'Queen', 'Sofá cama individual'], bath: 'Bañera y ducha',
    pos: [20, 5], face: [60, 5], tags: ['family', 'water', 'screen'] },
  { n: 7, price: 139, guests: 2, beds: 1, bedsLabel: 'Estudio', baths: 1, view: 'water', porch: 'detached', layout: 'studio',
    color: '#f2b49b', accent: '#b4573a', roof: '#cdc6c2',
    tagline: 'Porche independiente al amanecer',
    desc: 'No se pierda los amaneceres desde el porche independiente con mosquitero frente al agua.',
    rooms: ['Una cama queen', 'Un baño con ducha (sin bañera)', 'Cocina equipada', 'Porche independiente con mosquitero frente al agua'],
    beddings: ['Queen'], bath: 'Ducha',
    pos: [16, 18], face: [60, 22], tags: ['couple', 'water', 'screen'] },
  { n: 8, price: 139, guests: 2, beds: 1, bedsLabel: '1 dormitorio king', baths: 1, view: 'water', porch: 'deck', layout: 'suite',
    color: '#b8e0e6', accent: '#2c7c8a', roof: '#c4ccd0',
    tagline: 'Dormitorio king con vista al agua',
    desc: 'Cabaña amplia con dormitorio independiente y cama king con vista al agua. Las cabañas 8 y 9 son dos unidades convertidas de una casa móvil.',
    rooms: ['Dormitorio privado con vista al agua (cama king)', 'Un baño con ducha (sin bañera)', 'Cocina, sala y comedor', 'Terraza frontal con vista parcial al agua'],
    beddings: ['King'], bath: 'Ducha',
    pos: [4, 26], face: [4, 0], tags: ['couple', 'water', 'deck'] },
  { n: 9, price: 139, guests: 2, beds: 1, bedsLabel: '1 dormitorio king', baths: 1, view: 'partial', porch: 'deck', layout: 'suite',
    color: '#efe3a0', accent: '#a07f24', roof: '#c9c6b8',
    tagline: 'Para madrugadores, con dormitorio king',
    desc: 'Cabaña amplia con dormitorio independiente y cama king; ideal para madrugadores por la cercanía a la carretera y su posible tráfico matutino.',
    rooms: ['Dormitorio privado (cama king)', 'Un baño con ducha (sin bañera)', 'Cocina, sala y comedor', 'Terraza frontal con vista parcial al agua'],
    beddings: ['King'], bath: 'Ducha',
    pos: [-6, 26], face: [-6, 0], tags: ['couple', 'deck'] }
];

// Dimensiones ilustrativas del modelo 3D según distribución
export const DIMS = { studio: [5.2, 7.0], suite: [6.4, 7.2], two: [7.2, 8.0] };

export const ROOM_AMENITIES = [
  ['wifi', 'Wi-Fi y Smart TV'], ['ac', 'Aire acondicionado y calefacción'], ['fan', 'Ventiladores de techo'],
  ['kitchen', 'Estufa, horno y refrigerador'], ['coffee', 'Cafetera con café, crema y azúcar'], ['micro', 'Microondas y tostadora'],
  ['linen', 'Sábanas y toallas'], ['bath', 'Champú, acondicionador y gel'], ['dish', 'Vajilla, ollas y cubiertos']
];

export const PROPERTY_AMENITIES = [
  ['dock', 'Muelle privado para pescar', 'Según la marea'],
  ['sun', 'Vistas al amanecer', 'Sobre la bahía de Cedar Key'],
  ['paw', 'Se admiten mascotas', '$10 por noche y mascota'],
  ['cart', 'Carritos de golf y bicicletas', 'Alquiler en el lugar'],
  ['grill', 'Parrillas de gas y carbón', 'En el patio y jardines'],
  ['boat', 'Remolques de botes', 'Estacionamiento y lavado'],
  ['book', 'Libros y juegos', 'Para tardes tranquilas'],
  ['leaf', 'Reciclaje', 'Cuidamos la costa']
];

export const PHOTOS = [
  ['img/g1.jpg', 'Patio central con las cabañas de colores'],
  ['img/g2.jpg', 'El patio iluminado por la noche'],
  ['img/g3.jpg', 'Jardín al atardecer'],
  ['img/g4.jpg', 'Terraza sobre el agua y palmera'],
  ['img/g5.jpg', 'Manglar y bahía de Cedar Key'],
  ['img/g6.jpg', 'Dormitorio con decoración costera'],
  ['img/g7.jpg', 'Dormitorio con cama queen y ventilador de techo'],
  ['img/g8.jpg', 'Cocina completamente equipada']
];

export const REVIEWS = [
  ['¡Qué lugar tan maravilloso! Las cabañas tienen todo lo necesario para una estancia estupenda. Los dueños, Brian y Lisa, fueron muy amables y acogedores. No hay nada mejor que sentarse junto al agua.', 'Alan Levy', 'Local Guide · Google'],
  ['Mi esposo y yo visitamos Cedar Key por primera vez. Pirates Cove fue perfecto: seguro, limpio y con un personal muy amable. Las camas eran comodísimas. Nos movimos en bicicleta a todas partes.', 'Crissy Brescia', 'Google'],
  ['Incluso nos lo pasamos genial pescando en su muelle. ¡Tenemos muchas ganas de volver!', 'Alan Levy', 'Local Guide · Google']
];

export const TOURS = {
  water:  { title: 'Casas frente al agua', ids: [4, 5, 6, 7, 8] },
  couple: { title: 'Las mejores para parejas', ids: [4, 7, 2, 3] },
  family: { title: 'Opciones familiares', ids: [1, 6, 5] }
};
