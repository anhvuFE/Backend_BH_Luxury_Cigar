const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');
const BlogPost = require('../models/BlogPost');
const Order = require('../models/Order');

const categoryImages = {
  cuban: 'https://images.pexels.com/photos/415473/pexels-photo-415473.jpeg?auto=compress&cs=tinysrgb&w=1200',
  dominican: 'https://images.pexels.com/photos/302890/pexels-photo-302890.jpeg?auto=compress&cs=tinysrgb&w=1200',
  nicaraguan: 'https://images.pexels.com/photos/769289/pexels-photo-769289.jpeg?auto=compress&cs=tinysrgb&w=1200',
  premium: 'https://images.pexels.com/photos/164964/pexels-photo-164964.jpeg?auto=compress&cs=tinysrgb&w=1200',
  signature: 'https://images.pexels.com/photos/338713/pexels-photo-338713.jpeg?auto=compress&cs=tinysrgb&w=1200',
  vintage: 'https://images.pexels.com/photos/1304540/pexels-photo-1304540.jpeg?auto=compress&cs=tinysrgb&w=1200',
  accessories: 'https://images.pexels.com/photos/169365/pexels-photo-169365.jpeg?auto=compress&cs=tinysrgb&w=1200'
};

const productGalleries = {
  cuban: [
    [
      'https://images.pexels.com/photos/415473/pexels-photo-415473.jpeg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/402187/pexels-photo-402187.jpeg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/1121796/pexels-photo-1121796.jpeg?auto=compress&cs=tinysrgb&w=1200'
    ],
    [
      'https://images.pexels.com/photos/302890/pexels-photo-302890.jpeg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/415473/pexels-photo-415473.jpeg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/225228/pexels-photo-225228.jpeg?auto=compress&cs=tinysrgb&w=1200'
    ],
    [
      'https://images.pexels.com/photos/274190/pexels-photo-274190.jpeg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/338713/pexels-photo-338713.jpeg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/164964/pexels-photo-164964.jpeg?auto=compress&cs=tinysrgb&w=1200'
    ],
    [
      'https://images.pexels.com/photos/338713/pexels-photo-338713.jpeg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/164964/pexels-photo-164964.jpeg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/415473/pexels-photo-415473.jpeg?auto=compress&cs=tinysrgb&w=1200'
    ],
    [
      'https://images.pexels.com/photos/1121796/pexels-photo-1121796.jpeg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/2101187/pexels-photo-2101187.jpeg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/338713/pexels-photo-338713.jpeg?auto=compress&cs=tinysrgb&w=1200'
    ]
  ],
  premium: [
    [
      'https://images.pexels.com/photos/164964/pexels-photo-164964.jpeg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/6267/alcohol-drink-glass-beverage.jpg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/298210/pexels-photo-298210.jpeg?auto=compress&cs=tinysrgb&w=1200'
    ],
    [
      'https://images.pexels.com/photos/1304540/pexels-photo-1304540.jpeg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/164964/pexels-photo-164964.jpeg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/6267/alcohol-drink-glass-beverage.jpg?auto=compress&cs=tinysrgb&w=1200'
    ],
    [
      'https://images.pexels.com/photos/205867/pexels-photo-205867.jpeg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/6267/alcohol-drink-glass-beverage.jpg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/164964/pexels-photo-164964.jpeg?auto=compress&cs=tinysrgb&w=1200'
    ],
    [
      'https://images.pexels.com/photos/298210/pexels-photo-298210.jpeg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/164964/pexels-photo-164964.jpeg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/6267/alcohol-drink-glass-beverage.jpg?auto=compress&cs=tinysrgb&w=1200'
    ],
    [
      'https://images.pexels.com/photos/6267/alcohol-drink-glass-beverage.jpg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/164964/pexels-photo-164964.jpeg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/2101187/pexels-photo-2101187.jpeg?auto=compress&cs=tinysrgb&w=1200'
    ],
    [
      'https://images.pexels.com/photos/2101187/pexels-photo-2101187.jpeg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/164964/pexels-photo-164964.jpeg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/6267/alcohol-drink-glass-beverage.jpg?auto=compress&cs=tinysrgb&w=1200'
    ]
  ],
  signature: [
    [
      'https://images.pexels.com/photos/338713/pexels-photo-338713.jpeg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/205867/pexels-photo-205867.jpeg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/415473/pexels-photo-415473.jpeg?auto=compress&cs=tinysrgb&w=1200'
    ],
    [
      'https://images.pexels.com/photos/225228/pexels-photo-225228.jpeg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/338713/pexels-photo-338713.jpeg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/205867/pexels-photo-205867.jpeg?auto=compress&cs=tinysrgb&w=1200'
    ],
    [
      'https://images.pexels.com/photos/274190/pexels-photo-274190.jpeg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/338713/pexels-photo-338713.jpeg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/225228/pexels-photo-225228.jpeg?auto=compress&cs=tinysrgb&w=1200'
    ],
    [
      'https://images.pexels.com/photos/415473/pexels-photo-415473.jpeg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/338713/pexels-photo-338713.jpeg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/205867/pexels-photo-205867.jpeg?auto=compress&cs=tinysrgb&w=1200'
    ],
    [
      'https://images.pexels.com/photos/205867/pexels-photo-205867.jpeg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/338713/pexels-photo-338713.jpeg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/2101186/pexels-photo-2101186.jpeg?auto=compress&cs=tinysrgb&w=1200'
    ]
  ],
  vintage: [
    [
      'https://images.pexels.com/photos/1304540/pexels-photo-1304540.jpeg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/6267/alcohol-drink-glass-beverage.jpg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/164964/pexels-photo-164964.jpeg?auto=compress&cs=tinysrgb&w=1200'
    ],
    [
      'https://images.pexels.com/photos/1631879/pexels-photo-1631879.jpeg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/298210/pexels-photo-298210.jpeg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/1304540/pexels-photo-1304540.jpeg?auto=compress&cs=tinysrgb&w=1200'
    ],
    [
      'https://images.pexels.com/photos/298210/pexels-photo-298210.jpeg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/6267/alcohol-drink-glass-beverage.jpg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/1304540/pexels-photo-1304540.jpeg?auto=compress&cs=tinysrgb&w=1200'
    ]
  ],
  nicaraguan: [
    [
      'https://images.pexels.com/photos/769289/pexels-photo-769289.jpeg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/415473/pexels-photo-415473.jpeg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/205867/pexels-photo-205867.jpeg?auto=compress&cs=tinysrgb&w=1200'
    ],
    [
      'https://images.pexels.com/photos/1121796/pexels-photo-1121796.jpeg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/769289/pexels-photo-769289.jpeg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/415473/pexels-photo-415473.jpeg?auto=compress&cs=tinysrgb&w=1200'
    ],
    [
      'https://images.pexels.com/photos/205867/pexels-photo-205867.jpeg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/769289/pexels-photo-769289.jpeg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/1121796/pexels-photo-1121796.jpeg?auto=compress&cs=tinysrgb&w=1200'
    ],
    [
      'https://images.pexels.com/photos/415473/pexels-photo-415473.jpeg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/1121796/pexels-photo-1121796.jpeg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/2101187/pexels-photo-2101187.jpeg?auto=compress&cs=tinysrgb&w=1200'
    ]
  ],
  dominican: [
    [
      'https://images.pexels.com/photos/302890/pexels-photo-302890.jpeg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/274190/pexels-photo-274190.jpeg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/205867/pexels-photo-205867.jpeg?auto=compress&cs=tinysrgb&w=1200'
    ],
    [
      'https://images.pexels.com/photos/205867/pexels-photo-205867.jpeg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/302890/pexels-photo-302890.jpeg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/415473/pexels-photo-415473.jpeg?auto=compress&cs=tinysrgb&w=1200'
    ]
  ],
  accessories: [
    [
      'https://images.pexels.com/photos/169365/pexels-photo-169365.jpeg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/461430/pexels-photo-461430.jpeg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/602750/pexels-photo-602750.jpeg?auto=compress&cs=tinysrgb&w=1200'
    ],
    [
      'https://images.pexels.com/photos/602750/pexels-photo-602750.jpeg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/169365/pexels-photo-169365.jpeg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/445994/pexels-photo-445994.jpeg?auto=compress&cs=tinysrgb&w=1200'
    ],
    [
      'https://images.pexels.com/photos/445994/pexels-photo-445994.jpeg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/602750/pexels-photo-602750.jpeg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/169365/pexels-photo-169365.jpeg?auto=compress&cs=tinysrgb&w=1200'
    ],
    [
      'https://images.pexels.com/photos/461430/pexels-photo-461430.jpeg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/602750/pexels-photo-602750.jpeg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/169365/pexels-photo-169365.jpeg?auto=compress&cs=tinysrgb&w=1200'
    ],
    [
      'https://images.pexels.com/photos/295602/pexels-photo-295602.jpeg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/169365/pexels-photo-169365.jpeg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/602750/pexels-photo-602750.jpeg?auto=compress&cs=tinysrgb&w=1200'
    ],
    [
      'https://images.pexels.com/photos/301692/pexels-photo-301692.jpeg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/602750/pexels-photo-602750.jpeg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/169365/pexels-photo-169365.jpeg?auto=compress&cs=tinysrgb&w=1200'
    ]
  ]
};

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bh_luxury_cigar');
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Product.deleteMany({});
    await Category.deleteMany({});
    await BlogPost.deleteMany({});
    await Order.deleteMany({});
    console.log('Cleared existing data');

    // Create categories
    const categories = await Category.insertMany([
      { name: 'Cuban Cigars', slug: 'cuban-cigars', description: 'Premium Cuban cigars', image: categoryImages.cuban },
      { name: 'Dominican Cigars', slug: 'dominican-cigars', description: 'Fine Dominican cigars', image: categoryImages.dominican },
      { name: 'Nicaraguan Cigars', slug: 'nicaraguan-cigars', description: 'Bold Nicaraguan cigars', image: categoryImages.nicaraguan },
      { name: 'Premium Collection', slug: 'premium-collection', description: 'Ultra-premium and limited edition cigars', image: categoryImages.premium },
      { name: 'Signature Series', slug: 'signature-series', description: 'House signature blends and exclusive selections', image: categoryImages.signature },
      { name: 'Vintage Collection', slug: 'vintage-collection', description: 'Aged and vintage cigar selections', image: categoryImages.vintage },
      { name: 'Accessories', slug: 'accessories', description: 'Cigar accessories and humidors', image: categoryImages.accessories }
    ]);
    console.log('Created categories');

    // Create admin user
    const adminPassword = await bcrypt.hash('123456', 10);
    const userPassword = await bcrypt.hash('123456', 10);

    const users = await User.insertMany([
      {
        name: 'Admin User',
        email: 'admin@gmail.com',
        password: adminPassword,
        role: 'admin',
        phone: '123-456-7890'
      },
      {
        name: 'Xuan Anh',
        email: 'xanh@gmail.com',
        password: userPassword,
        role: 'user',
        phone: '098-765-4321'
      }
    ]);
    console.log('Created users');

    // Create products
    const products = await Product.insertMany([
      // Cuban Cigars
      {
        name: 'Cohiba Behike 52',
        brand: 'Cohiba',
        price: 150.00,
        originalPrice: 180.00,
        image: productGalleries.cuban[0][0],
        images: productGalleries.cuban[0],
        description: 'The Cohiba Behike 52 is one of the most exclusive cigars in the world, featuring rare tobacco from the Medio Tiempo leaf.',
        inStock: true,
        isNew: true,
        isFeatured: true,
        category: categories[0].name,
        specifications: {
          origin: 'Cuba',
          size: '4.5" x 52',
          strength: 'Medium-Full',
          wrapper: 'Cuban',
          binder: 'Cuban',
          filler: 'Cuban with Medio Tiempo'
        }
      },
      {
        name: 'Montecristo No. 2',
        brand: 'Montecristo',
        price: 85.00,
        image: productGalleries.cuban[1][0],
        images: productGalleries.cuban[1],
        description: 'The Montecristo No. 2 is perhaps the most popular Cuban cigar, known for its perfect construction and complex flavors.',
        inStock: true,
        isFeatured: true,
        category: categories[0].name,
        specifications: {
          origin: 'Cuba',
          size: '6.1" x 52',
          strength: 'Medium',
          wrapper: 'Cuban',
          binder: 'Cuban',
          filler: 'Cuban'
        }
      },
      {
        name: 'Romeo y Julieta Churchill',
        brand: 'Romeo y Julieta',
        price: 75.00,
        image: productGalleries.cuban[2][0],
        images: productGalleries.cuban[2],
        description: 'A classic Cuban Churchill named after Winston Churchill himself, offering a complex and satisfying smoke.',
        inStock: true,
        category: categories[0].name,
        specifications: {
          origin: 'Cuba',
          size: '7" x 47',
          strength: 'Medium',
          wrapper: 'Cuban',
          binder: 'Cuban',
          filler: 'Cuban'
        }
      },
      {
        name: 'Partagas Serie D No. 4',
        brand: 'Partagas',
        price: 65.00,
        originalPrice: 75.00,
        image: productGalleries.cuban[3][0],
        images: productGalleries.cuban[3],
        description: 'A robust Cuban robusto with earthy and spicy notes, perfect for experienced cigar smokers.',
        inStock: true,
        isNew: true,
        category: categories[0].name,
        specifications: {
          origin: 'Cuba',
          size: '4.9" x 50',
          strength: 'Full',
          wrapper: 'Cuban',
          binder: 'Cuban',
          filler: 'Cuban'
        }
      },
      {
        name: 'H. Upmann Magnum 46',
        brand: 'H. Upmann',
        price: 55.00,
        image: productGalleries.cuban[4][0],
        images: productGalleries.cuban[4],
        description: 'A smooth and elegant Cuban cigar with honey and cedar notes, ideal for afternoon smoking.',
        inStock: true,
        category: categories[0].name,
        specifications: {
          origin: 'Cuba',
          size: '5.1" x 46',
          strength: 'Medium',
          wrapper: 'Cuban',
          binder: 'Cuban',
          filler: 'Cuban'
        }
      },

      // Premium Collection
      {
        name: 'Arturo Fuente OpusX',
        brand: 'Arturo Fuente',
        price: 125.00,
        image: productGalleries.premium[0][0],
        images: productGalleries.premium[0],
        description: 'The OpusX is a legendary Dominican cigar that rivals the finest Cuban cigars in quality and flavor.',
        inStock: true,
        isNew: true,
        isFeatured: true,
        category: categories[3].name,
        specifications: {
          origin: 'Dominican Republic',
          size: '5.6" x 46',
          strength: 'Full',
          wrapper: 'Dominican',
          binder: 'Dominican',
          filler: 'Dominican'
        }
      },
      {
        name: 'Davidoff Year of the Dragon',
        brand: 'Davidoff',
        price: 180.00,
        originalPrice: 200.00,
        image: productGalleries.premium[1][0],
        images: productGalleries.premium[1],
        description: 'Limited edition Davidoff celebrating the Year of the Dragon with exquisite Dominican tobacco.',
        inStock: true,
        isFeatured: true,
        category: categories[3].name,
        specifications: {
          origin: 'Dominican Republic',
          size: '6" x 54',
          strength: 'Medium-Full',
          wrapper: 'Ecuador Connecticut',
          binder: 'Dominican',
          filler: 'Dominican'
        }
      },
      {
        name: 'Ashton ESG 20 Year Salute',
        brand: 'Ashton',
        price: 220.00,
        image: productGalleries.premium[2][0],
        images: productGalleries.premium[2],
        description: 'Anniversary edition featuring aged Dominican tobacco with complex flavors and perfect construction.',
        inStock: true,
        category: categories[3].name,
        specifications: {
          origin: 'Dominican Republic',
          size: '5.5" x 52',
          strength: 'Full',
          wrapper: 'Ecuador Habano',
          binder: 'Dominican',
          filler: 'Dominican'
        }
      },
      {
        name: 'Fuente Fuente OpusX Lost City',
        brand: 'Arturo Fuente',
        price: 165.00,
        image: productGalleries.premium[3][0],
        images: productGalleries.premium[3],
        description: 'Rare OpusX blend from the Lost City series, featuring specially aged tobacco from Chateau de la Fuente.',
        inStock: true,
        isNew: true,
        category: categories[3].name,
        specifications: {
          origin: 'Dominican Republic',
          size: '6.25" x 48',
          strength: 'Full',
          wrapper: 'Dominican',
          binder: 'Dominican',
          filler: 'Dominican'
        }
      },
      {
        name: 'Padron 50th Anniversary',
        brand: 'Padron',
        price: 145.00,
        originalPrice: 160.00,
        image: productGalleries.premium[4][0],
        images: productGalleries.premium[4],
        description: 'Commemorating 50 years of Padron excellence with this limited edition Nicaraguan masterpiece.',
        inStock: true,
        category: categories[3].name,
        specifications: {
          origin: 'Nicaragua',
          size: '6.5" x 54',
          strength: 'Full',
          wrapper: 'Nicaraguan',
          binder: 'Nicaraguan',
          filler: 'Nicaraguan'
        }
      },
      {
        name: 'Liga Privada No. 9',
        brand: 'Drew Estate',
        price: 135.00,
        image: productGalleries.premium[5][0],
        images: productGalleries.premium[5],
        description: 'Ultra-premium blend originally created for the personal smoking pleasure of Drew Estate executives.',
        inStock: true,
        isFeatured: true,
        category: categories[3].name,
        specifications: {
          origin: 'Nicaragua',
          size: '6" x 52',
          strength: 'Full',
          wrapper: 'Connecticut Broadleaf',
          binder: 'Brazilian',
          filler: 'Nicaraguan'
        }
      },

      // Signature Series
      {
        name: 'BH Luxury Signature Blend',
        brand: 'BH Luxury',
        price: 95.00,
        image: productGalleries.signature[0][0],
        images: productGalleries.signature[0],
        description: 'Our house signature blend featuring carefully selected tobaccos from three countries.',
        inStock: true,
        isFeatured: true,
        category: categories[4].name,
        specifications: {
          origin: 'Multi-Country',
          size: '6" x 50',
          strength: 'Medium-Full',
          wrapper: 'Ecuador Habano',
          binder: 'Nicaraguan',
          filler: 'Dominican/Nicaraguan'
        }
      },
      {
        name: 'Master Blender Reserve',
        brand: 'BH Luxury',
        price: 115.00,
        originalPrice: 130.00,
        image: productGalleries.signature[1][0],
        images: productGalleries.signature[1],
        description: 'Limited production blend created by our master blender using rare aged tobaccos.',
        inStock: true,
        isNew: true,
        category: categories[4].name,
        specifications: {
          origin: 'Nicaragua',
          size: '5.5" x 54',
          strength: 'Full',
          wrapper: 'San Andres',
          binder: 'Nicaraguan',
          filler: 'Nicaraguan'
        }
      },
      {
        name: 'Heritage Collection Toro',
        brand: 'BH Luxury',
        price: 85.00,
        image: productGalleries.signature[2][0],
        images: productGalleries.signature[2],
        description: 'Honoring traditional cigar-making techniques with this well-balanced medium-bodied blend.',
        inStock: true,
        category: categories[4].name,
        specifications: {
          origin: 'Honduras',
          size: '6" x 52',
          strength: 'Medium',
          wrapper: 'Connecticut Shade',
          binder: 'Honduran',
          filler: 'Honduran/Nicaraguan'
        }
      },
      {
        name: 'Anniversary Edition Robusto',
        brand: 'BH Luxury',
        price: 105.00,
        image: productGalleries.signature[3][0],
        images: productGalleries.signature[3],
        description: 'Commemorating our anniversary with this special blend featuring 7-year aged filler tobacco.',
        inStock: true,
        isFeatured: true,
        category: categories[4].name,
        specifications: {
          origin: 'Dominican Republic',
          size: '5" x 50',
          strength: 'Medium-Full',
          wrapper: 'Ecuador Connecticut',
          binder: 'Dominican',
          filler: 'Dominican Aged'
        }
      },
      {
        name: 'Platinum Series Churchill',
        brand: 'BH Luxury',
        price: 125.00,
        originalPrice: 140.00,
        image: productGalleries.signature[4][0],
        images: productGalleries.signature[4],
        description: 'Top-tier house blend with platinum band, featuring the finest tobaccos from our private reserves.',
        inStock: true,
        category: categories[4].name,
        specifications: {
          origin: 'Multi-Country',
          size: '7" x 48',
          strength: 'Full',
          wrapper: 'Ecuador Habano Oscuro',
          binder: 'Nicaraguan',
          filler: 'Dominican/Nicaraguan/Peruvian'
        }
      },

      // Vintage Collection
      {
        name: 'Vintage 2015 Maduro',
        brand: 'Casa Magna',
        price: 75.00,
        image: productGalleries.vintage[0][0],
        images: productGalleries.vintage[0],
        description: 'Aged maduro wrapper from 2015 harvest, offering rich chocolate and coffee notes.',
        inStock: true,
        category: categories[5].name,
        specifications: {
          origin: 'Nicaragua',
          size: '5.5" x 50',
          strength: 'Medium-Full',
          wrapper: 'Connecticut Broadleaf Maduro',
          binder: 'Nicaraguan',
          filler: 'Nicaraguan'
        }
      },
      {
        name: 'Aged Connecticut Corona',
        brand: 'Vintage Cigars',
        price: 65.00,
        originalPrice: 80.00,
        image: productGalleries.vintage[1][0],
        images: productGalleries.vintage[1],
        description: 'Classic Connecticut wrapper aged 5 years for smooth, creamy flavors with subtle complexity.',
        inStock: true,
        isNew: true,
        category: categories[5].name,
        specifications: {
          origin: 'Dominican Republic',
          size: '5.6" x 42',
          strength: 'Mild-Medium',
          wrapper: 'Connecticut Shade Aged',
          binder: 'Dominican',
          filler: 'Dominican'
        }
      },
      {
        name: 'Reserva Especial 2018',
        brand: 'Vintage Cigars',
        price: 95.00,
        image: productGalleries.vintage[2][0],
        images: productGalleries.vintage[2],
        description: 'Special reserve blend from 2018 featuring perfectly aged Nicaraguan tobaccos.',
        inStock: true,
        isFeatured: true,
        category: categories[5].name,
        specifications: {
          origin: 'Nicaragua',
          size: '6" x 52',
          strength: 'Full',
          wrapper: 'Nicaraguan Corojo',
          binder: 'Nicaraguan',
          filler: 'Nicaraguan Aged'
        }
      },

      // Nicaraguan Cigars
      {
        name: 'Padron 1964 Anniversary',
        brand: 'Padron',
        price: 95.00,
        originalPrice: 110.00,
        image: productGalleries.nicaraguan[0][0],
        images: productGalleries.nicaraguan[0],
        description: 'Celebrating Padron anniversary, this Nicaraguan puro offers rich, complex flavors with perfect balance.',
        inStock: true,
        category: categories[2].name,
        specifications: {
          origin: 'Nicaragua',
          size: '6" x 54',
          strength: 'Medium-Full',
          wrapper: 'Nicaraguan',
          binder: 'Nicaraguan',
          filler: 'Nicaraguan'
        }
      },
      {
        name: 'Oliva Serie V Melanio',
        brand: 'Oliva',
        price: 45.00,
        image: productGalleries.nicaraguan[1][0],
        images: productGalleries.nicaraguan[1],
        description: 'Award-winning Nicaraguan blend with Sumatra wrapper, full-bodied with rich espresso notes.',
        inStock: true,
        isFeatured: true,
        category: categories[2].name,
        specifications: {
          origin: 'Nicaragua',
          size: '6.5" x 52',
          strength: 'Full',
          wrapper: 'Sumatra',
          binder: 'Nicaraguan',
          filler: 'Nicaraguan'
        }
      },
      {
        name: 'My Father Le Bijou 1922',
        brand: 'My Father',
        price: 55.00,
        image: productGalleries.nicaraguan[2][0],
        images: productGalleries.nicaraguan[2],
        description: 'Premium Nicaraguan cigar with Habano Oscuro wrapper, offering bold and complex flavors.',
        inStock: true,
        category: categories[2].name,
        specifications: {
          origin: 'Nicaragua',
          size: '5" x 52',
          strength: 'Full',
          wrapper: 'Habano Oscuro',
          binder: 'Nicaraguan',
          filler: 'Nicaraguan'
        }
      },
      {
        name: 'Flor de las Antillas Toro',
        brand: 'My Father',
        price: 35.00,
        originalPrice: 42.00,
        image: productGalleries.nicaraguan[3][0],
        images: productGalleries.nicaraguan[3],
        description: 'Cigar of the Year winner featuring Sun Grown wrapper with balanced medium-full body.',
        inStock: true,
        isNew: true,
        category: categories[2].name,
        specifications: {
          origin: 'Nicaragua',
          size: '6" x 52',
          strength: 'Medium-Full',
          wrapper: 'Sun Grown',
          binder: 'Nicaraguan',
          filler: 'Nicaraguan'
        }
      },

      // Dominican Cigars
      {
        name: 'Fuente Hemingway Short Story',
        brand: 'Arturo Fuente',
        price: 28.00,
        image: productGalleries.dominican[0][0],
        images: productGalleries.dominican[0],
        description: 'Classic Dominican perfectos with African Cameroon wrapper, smooth and flavorful.',
        inStock: true,
        category: categories[1].name,
        specifications: {
          origin: 'Dominican Republic',
          size: '4" x 48',
          strength: 'Medium',
          wrapper: 'African Cameroon',
          binder: 'Dominican',
          filler: 'Dominican'
        }
      },
      {
        name: 'Ashton Classic Corona',
        brand: 'Ashton',
        price: 18.00,
        image: productGalleries.dominican[1][0],
        images: productGalleries.dominican[1],
        description: 'Mild and creamy Dominican cigar perfect for beginners and morning smoking.',
        inStock: true,
        category: categories[1].name,
        specifications: {
          origin: 'Dominican Republic',
          size: '5.5" x 44',
          strength: 'Mild',
          wrapper: 'Connecticut Shade',
          binder: 'Dominican',
          filler: 'Dominican'
        }
      },

      // Accessories
      {
        name: 'Premium Cedar Humidor',
        brand: 'BH Luxury',
        price: 250.00,
        image: productGalleries.accessories[0][0],
        images: productGalleries.accessories[0],
        description: 'Handcrafted Spanish cedar humidor with digital hygrometer, holds up to 100 cigars.',
        inStock: true,
        category: categories[6].name,
        specifications: {
          origin: 'Spain',
          size: '15" x 10" x 6"',
          strength: 'N/A',
          wrapper: 'Spanish Cedar',
          binder: 'N/A',
          filler: 'N/A'
        }
      },
      {
        name: 'Bộ Phụ Kiện Gốm Bát Lửa & Dao Cắt COHIBA BEHIKE X',
        brand: 'HABANOS',
        price: 14168000,
        image: productGalleries.accessories[1][0],
        images: productGalleries.accessories[1],
        description: 'Bộ phụ kiện cao cấp gồm bát lửa gốm và dao cắt xi gà chính hãng COHIBA BEHIKE X.',
        inStock: true,
        isFeatured: true,
        category: categories[6].name,
        specifications: {
          origin: 'Cuba',
          size: 'Set bộ đôi',
          strength: 'N/A',
          wrapper: 'Gốm cao cấp',
          binder: 'N/A',
          filler: 'N/A'
        }
      },
      {
        name: 'Dao Cắt Xi Gà Hai Lưỡi H.UPMANN',
        brand: 'HABANOS',
        price: 286000,
        image: productGalleries.accessories[2][0],
        images: productGalleries.accessories[2],
        description: 'Dao cắt xi gà hai lưỡi chính hãng H.UPMANN với thiết kế tinh xảo và độ sắc bén cao.',
        inStock: true,
        category: categories[6].name,
        specifications: {
          origin: 'Cuba',
          size: 'Compact',
          strength: 'N/A',
          wrapper: 'Thép không gỉ',
          binder: 'N/A',
          filler: 'N/A'
        }
      },
      {
        name: 'Gạt Tàn Xi Gà Bằng Gốm FLOR DE CASTILLO SNAKE',
        brand: 'FLOR DE CASTILLO',
        price: 3348000,
        image: productGalleries.accessories[3][0],
        images: productGalleries.accessories[3],
        description: 'Gạt tàn xi gà bằng gốm cao cấp với họa tiết rắn độc đáo, thiết kế nghệ thuật từ FLOR DE CASTILLO.',
        inStock: true,
        category: categories[6].name,
        specifications: {
          origin: 'Nicaragua',
          size: 'Large',
          strength: 'N/A',
          wrapper: 'Gốm sứ cao cấp',
          binder: 'N/A',
          filler: 'N/A'
        }
      },
      {
        name: 'Gạt Tàn Xi Gà Bằng Gốm FLOR DE CASTILLO ART',
        brand: 'FLOR DE CASTILLO',
        price: 3348000,
        image: productGalleries.accessories[4][0],
        images: productGalleries.accessories[4],
        description: 'Gạt tàn xi gà bằng gốm nghệ thuật với thiết kế tinh tế và màu sắc đẹp mắt từ FLOR DE CASTILLO.',
        inStock: true,
        category: categories[6].name,
        specifications: {
          origin: 'Nicaragua',
          size: 'Large',
          strength: 'N/A',
          wrapper: 'Gốm sứ nghệ thuật',
          binder: 'N/A',
          filler: 'N/A'
        }
      },
      {
        name: 'Gạt Tàn Gốm S.T. Dupont Fender 006425',
        brand: 'S.T. DUPONT',
        price: 13996800,
        image: productGalleries.accessories[5][0],
        images: productGalleries.accessories[5],
        description: 'Gạt tàn gốm cao cấp từ thương hiệu S.T. Dupont phối hợp với Fender, thiết kế độc quyền và sang trọng.',
        inStock: true,
        isFeatured: true,
        category: categories[6].name,
        specifications: {
          origin: 'France',
          size: 'Premium',
          strength: 'N/A',
          wrapper: 'Gốm sứ cao cấp',
          binder: 'N/A',
          filler: 'N/A'
        }
      }
    ]);
    console.log('Created products');

    const createOrderItem = (product, quantity) => ({
      product: product._id,
      name: product.name,
      price: product.price,
      quantity,
      image: product.image
    });

    const orderBaseAddress = {
      name: 'Xuan Anh',
      email: 'xanh@gmail.com',
      street: '123 Nguyen Trai',
      city: 'Hanoi',
      state: 'HN',
      zipCode: '100000',
      country: 'Vietnam',
      phone: '098-765-4321'
    };

    const rawOrders = [
      {
        user: users[1]._id,
        items: [
          createOrderItem(products[0], 6),
          createOrderItem(products[1], 2)
        ],
        shippingAddress: orderBaseAddress,
        paymentMethod: 'credit_card',
        paymentStatus: 'completed',
        orderStatus: 'delivered',
        isPaid: true,
        isDelivered: true,
        paidAt: new Date(),
        deliveredAt: new Date()
      },
      {
        user: users[1]._id,
        items: [
          createOrderItem(products[0], 4),
          createOrderItem(products[5], 1)
        ],
        shippingAddress: orderBaseAddress,
        paymentMethod: 'credit_card',
        paymentStatus: 'completed',
        orderStatus: 'delivered',
        isPaid: true,
        isDelivered: true,
        paidAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        deliveredAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        user: users[1]._id,
        items: [
          createOrderItem(products[3], 3),
          createOrderItem(products[4], 1)
        ],
        shippingAddress: orderBaseAddress,
        paymentMethod: 'credit_card',
        paymentStatus: 'completed',
        orderStatus: 'shipped',
        isPaid: true,
        isDelivered: false,
        paidAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      },
      {
        user: users[1]._id,
        items: [
          createOrderItem(products[0], 2),
          createOrderItem(products[10], 1),
          createOrderItem(products[12], 1)
        ],
        shippingAddress: {
          ...orderBaseAddress,
          street: '456 Le Loi',
          city: 'Ho Chi Minh City',
          state: 'HCM'
        },
        paymentMethod: 'paypal',
        paymentStatus: 'completed',
        orderStatus: 'processing',
        isPaid: true,
        isDelivered: false,
        paidAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      }
    ].map((order, index) => {
      const itemsPrice = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const createdAt = new Date(Date.now() - (index + 1) * 24 * 60 * 60 * 1000);
      return {
        ...order,
        orderNumber: `ORD-SEED-${index + 1}`,
        itemsPrice,
        taxPrice: 0,
        shippingPrice: 0,
        totalPrice: itemsPrice,
        createdAt,
        updatedAt: createdAt
      };
    });

    await Order.insertMany(rawOrders);
    console.log('Created sample orders');

    // Create blog posts
    const blogBaseTimestamp = Date.now();
    const daysAgo = (days) => new Date(blogBaseTimestamp - days * 24 * 60 * 60 * 1000);

    await BlogPost.insertMany([
      {
        title: 'The Art of Cigar Aging',
        excerpt: 'Discover how proper aging transforms a good cigar into an exceptional smoking experience.',
        content: 'Aging cigars is an art form that requires patience, proper storage conditions, and knowledge. Like fine wine, cigars can improve significantly with age. The process allows the tobacco leaves to marry their flavors, creating a more complex and refined smoking experience...',
        image: '/images/blog/cigar-aging.jpg',
        author: 'John Martinez',
        category: 'Education',
        slug: 'art-of-cigar-aging',
        isPublished: true,
        publishDate: daysAgo(60),
        views: 482,
        createdAt: daysAgo(60),
        updatedAt: daysAgo(60)
      },
      {
        title: 'Cuban vs Dominican Cigars: A Comparison',
        excerpt: 'Explore the differences between these two premier cigar-producing regions.',
        content: 'The debate between Cuban and Dominican cigars has been ongoing for decades. While Cuba has the historic reputation, Dominican Republic has emerged as a powerhouse in premium cigar production...',
        image: '/images/blog/cuban-vs-dominican.jpg',
        author: 'Sarah Chen',
        category: 'Reviews',
        slug: 'cuban-vs-dominican-cigars',
        isPublished: true,
        publishDate: daysAgo(45),
        views: 377,
        createdAt: daysAgo(45),
        updatedAt: daysAgo(45)
      },
      {
        title: 'How to Properly Cut and Light Your Cigar',
        excerpt: 'Master the basics of cigar preparation for the perfect smoking experience.',
        content: 'The way you cut and light your cigar can significantly impact your smoking experience. A proper cut ensures good draw, while correct lighting ensures even burning...',
        image: '/images/blog/cutting-lighting.jpg',
        author: 'Michael Brown',
        category: 'How-To',
        slug: 'how-to-cut-light-cigar',
        isPublished: true,
        publishDate: daysAgo(35),
        views: 295,
        createdAt: daysAgo(35),
        updatedAt: daysAgo(35)
      },
      {
        title: 'Pairing Cigars with Whiskey for Beginners',
        excerpt: 'Learn how to match cigar strengths and whiskey profiles for memorable tasting sessions.',
        content: 'Pairing cigars with whiskey for beginners combines flavor balance, aroma, and finish. Start with medium bodied cigars alongside approachable single malt expressions to understand how sweetness, spice, and smoke interact. As your palate matures, experiment with bolder cigars and cask strength pours to create layered pairings that highlight the best qualities of both.',
        image: '/images/blog/cigar-whiskey.jpg',
        author: 'Laura Nguyen',
        category: 'Pairings',
        slug: 'pairing-cigars-with-whiskey',
        isPublished: true,
        publishDate: daysAgo(25),
        views: 310,
        createdAt: daysAgo(25),
        updatedAt: daysAgo(25)
      },
      {
        title: 'Behind the Blend Interview with Master Blender Carlos Ruiz',
        excerpt: 'An in depth conversation about crafting small batch luxury cigars.',
        content: 'Master blender Carlos Ruiz shares how he sources aged tobaccos, orchestrates fermentation, and fine tunes the final blend for flagship releases. From selecting ligero leaves for strength to resting finished cigars for consistency, the interview offers a behind the scenes look at the artistry that defines celebrated boutique labels.',
        image: '/images/blog/master-blender-interview.jpg',
        author: 'Emily Carter',
        category: 'Interviews',
        slug: 'behind-the-blend-carlos-ruiz',
        isPublished: true,
        publishDate: daysAgo(20),
        views: 198,
        createdAt: daysAgo(20),
        updatedAt: daysAgo(20)
      },
      {
        title: 'Cigar Etiquette for Luxury Events',
        excerpt: 'Polish your cigar etiquette before the next lounge opening or private pairing dinner.',
        content: 'Luxury cigar events demand attention to etiquette from cutting technique to ash discipline. Engage hosts and fellow guests respectfully by handling cigars with care, managing smoke direction, and pacing each draw. Understanding unspoken rules creates a relaxed environment that lets everyone focus on the craftsmanship of the cigars being celebrated.',
        image: '/images/blog/cigar-etiquette.jpg',
        author: 'James Turner',
        category: 'Lifestyle',
        slug: 'cigar-etiquette-luxury-events',
        isPublished: true,
        publishDate: daysAgo(15),
        views: 156,
        createdAt: daysAgo(15),
        updatedAt: daysAgo(15)
      },
      {
        title: 'Building Your First Home Humidor',
        excerpt: 'Step by step guidance to create stable storage for a growing premium cigar collection.',
        content: 'A dependable home humidor protects cigars from humidity swings that can dull flavor or cause cracking. Begin by seasoning the interior Spanish cedar, then select humidification elements that hold steady around 70 percent. Rotate cigars monthly and track temperature to keep every stick ready for impromptu gatherings or personal relaxation.',
        image: '/images/blog/home-humidor.jpg',
        author: 'Sofia Ramirez',
        category: 'How-To',
        slug: 'building-your-first-home-humidor',
        isPublished: true,
        publishDate: daysAgo(10),
        views: 221,
        createdAt: daysAgo(10),
        updatedAt: daysAgo(10)
      },
      {
        title: 'Limited Edition Cigars to Watch in 2024',
        excerpt: 'A curated list of standout limited runs and collaborations for 2024.',
        content: 'From anniversary releases to festival exclusives, 2024 delivers exciting limited edition cigars worth pursuing. Brands are experimenting with hybrid seeds, rare wrappers, and collaboration blends that showcase regional terroir. Secure boxes early and document tasting notes, because many of these releases will not be repeated once the final shipment ships.',
        image: '/images/blog/limited-edition-2024.jpg',
        author: 'Victor Le',
        category: 'News',
        slug: 'limited-edition-cigars-2024',
        isPublished: true,
        publishDate: daysAgo(5),
        views: 264,
        createdAt: daysAgo(5),
        updatedAt: daysAgo(5)
      }
    ]);
    console.log('Created blog posts');

    console.log('\\n=== Seed Data Created Successfully ===');
    console.log('\\nAdmin Login:');
    console.log('Email: admin@gmail.com');
    console.log('Password: 123456');
    console.log('\\nUser Login:');
    console.log('Email: xanh@gmail.com');
    console.log('Password: 123456');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

// Run seed
seedData();
