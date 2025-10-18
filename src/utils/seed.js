const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');
const BlogPost = require('../models/BlogPost');

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
    console.log('Cleared existing data');

    // Create categories
    const categories = await Category.insertMany([
      { name: 'Cuban Cigars', slug: 'cuban-cigars', description: 'Premium Cuban cigars', image: '/assets/images/banner1.png' },
      { name: 'Dominican Cigars', slug: 'dominican-cigars', description: 'Fine Dominican cigars', image: '/assets/images/banner2.png' },
      { name: 'Nicaraguan Cigars', slug: 'nicaraguan-cigars', description: 'Bold Nicaraguan cigars', image: '/assets/images/banner3.png' },
      { name: 'Premium Collection', slug: 'premium-collection', description: 'Ultra-premium and limited edition cigars', image: '/assets/images/banner4.png' },
      { name: 'Signature Series', slug: 'signature-series', description: 'House signature blends and exclusive selections', image: '/assets/images/banner5.png' },
      { name: 'Vintage Collection', slug: 'vintage-collection', description: 'Aged and vintage cigar selections', image: '/assets/images/banner6.png' },
      { name: 'Accessories', slug: 'accessories', description: 'Cigar accessories and humidors', image: '/assets/images/pro1.png' }
    ]);
    console.log('Created categories');

    // Create admin user
    const adminPassword = await bcrypt.hash('123456', 10);
    const userPassword = await bcrypt.hash('123456', 10);

    const users = await User.insertMany([
      {
        name: 'Admin User',
        email: 'admin@bhcigar.com',
        password: adminPassword,
        role: 'admin',
        phone: '123-456-7890'
      },
      {
        name: 'John Doe',
        email: 'john@example.com',
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
        image: '/assets/images/SP/1.png',
        images: ['/assets/images/SP/1.png', '/assets/images/SP/2.png'],
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
        image: '/assets/images/SP/2.png',
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
        image: '/assets/images/SP/3.png',
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
        image: '/assets/images/SP/4.png',
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
        image: '/assets/images/SP/5.png',
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
        image: '/assets/images/PR/1.png',
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
        image: '/assets/images/PR/2.png',
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
        image: '/assets/images/PR/3.png',
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
        image: '/assets/images/PR/4.png',
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
        image: '/assets/images/PR/5.png',
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
        image: '/assets/images/PR/6.png',
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
        image: '/assets/images/PK/1.png',
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
        image: '/assets/images/PK/2.png',
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
        image: '/assets/images/PK/3.png',
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
        image: '/assets/images/PK/4.png',
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
        image: '/assets/images/PK/5.png',
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
        image: '/assets/images/BV/1.png',
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
        image: '/assets/images/BV/2.png',
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
        image: '/assets/images/BV/3.png',
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
        image: '/assets/images/pro2.png',
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
        image: '/assets/images/pro3.png',
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
        image: '/assets/images/pro4.png',
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
        image: '/assets/images/pro5.png',
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
        image: '/assets/images/pro6.png',
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
        image: '/assets/images/pro1.png',
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
        image: '/assets/images/logo.png',
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
      }
    ]);
    console.log('Created products');

    // Create blog posts
    const blogPosts = await BlogPost.insertMany([
      {
        title: 'The Art of Cigar Aging',
        excerpt: 'Discover how proper aging transforms a good cigar into an exceptional smoking experience.',
        content: 'Aging cigars is an art form that requires patience, proper storage conditions, and knowledge. Like fine wine, cigars can improve significantly with age. The process allows the tobacco leaves to marry their flavors, creating a more complex and refined smoking experience...',
        image: '/images/blog/cigar-aging.jpg',
        author: 'John Martinez',
        category: 'Education',
        slug: 'art-of-cigar-aging',
        isPublished: true
      },
      {
        title: 'Cuban vs Dominican Cigars: A Comparison',
        excerpt: 'Explore the differences between these two premier cigar-producing regions.',
        content: 'The debate between Cuban and Dominican cigars has been ongoing for decades. While Cuba has the historic reputation, Dominican Republic has emerged as a powerhouse in premium cigar production...',
        image: '/images/blog/cuban-vs-dominican.jpg',
        author: 'Sarah Chen',
        category: 'Reviews',
        slug: 'cuban-vs-dominican-cigars',
        isPublished: true
      },
      {
        title: 'How to Properly Cut and Light Your Cigar',
        excerpt: 'Master the basics of cigar preparation for the perfect smoking experience.',
        content: 'The way you cut and light your cigar can significantly impact your smoking experience. A proper cut ensures good draw, while correct lighting ensures even burning...',
        image: '/images/blog/cutting-lighting.jpg',
        author: 'Michael Brown',
        category: 'How-To',
        slug: 'how-to-cut-light-cigar',
        isPublished: true
      }
    ]);
    console.log('Created blog posts');

    console.log('\\n=== Seed Data Created Successfully ===');
    console.log('\\nAdmin Login:');
    console.log('Email: admin@bhcigar.com');
    console.log('Password: 123456');
    console.log('\\nUser Login:');
    console.log('Email: john@example.com');
    console.log('Password: 123456');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

// Run seed
seedData();