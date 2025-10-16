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
      { name: 'Cuban Cigars', slug: 'cuban-cigars', description: 'Premium Cuban cigars' },
      { name: 'Dominican Cigars', slug: 'dominican-cigars', description: 'Fine Dominican cigars' },
      { name: 'Nicaraguan Cigars', slug: 'nicaraguan-cigars', description: 'Bold Nicaraguan cigars' },
      { name: 'Accessories', slug: 'accessories', description: 'Cigar accessories and humidors' }
    ]);
    console.log('Created categories');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const userPassword = await bcrypt.hash('user123', 10);

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
      {
        name: 'Cohiba Behike 52',
        brand: 'Cohiba',
        price: 150.00,
        originalPrice: 180.00,
        image: '/images/cohiba-behike-52.jpg',
        images: ['/images/cohiba-behike-52-1.jpg', '/images/cohiba-behike-52-2.jpg'],
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
        image: '/images/montecristo-2.jpg',
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
        name: 'Arturo Fuente OpusX',
        brand: 'Arturo Fuente',
        price: 125.00,
        image: '/images/opus-x.jpg',
        description: 'The OpusX is a legendary Dominican cigar that rivals the finest Cuban cigars in quality and flavor.',
        inStock: true,
        isNew: true,
        category: categories[1].name,
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
        name: 'Padron 1964 Anniversary',
        brand: 'Padron',
        price: 95.00,
        originalPrice: 110.00,
        image: '/images/padron-1964.jpg',
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
        name: 'Premium Cedar Humidor',
        brand: 'BH Luxury',
        price: 250.00,
        image: '/images/humidor.jpg',
        description: 'Handcrafted Spanish cedar humidor with digital hygrometer, holds up to 100 cigars.',
        inStock: true,
        category: categories[3].name,
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
    console.log('Password: admin123');
    console.log('\\nUser Login:');
    console.log('Email: john@example.com');
    console.log('Password: user123');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

// Run seed
seedData();