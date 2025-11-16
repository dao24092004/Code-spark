// Script để seed dữ liệu mẫu cho organizations
require('dotenv').config();
const { Sequelize, DataTypes } = require('sequelize');

// Cấu hình database - Sử dụng ORGANIZATION_DB từ .env
const sequelize = new Sequelize(
  process.env.ORGANIZATION_DB_NAME || 'organization_db',
  process.env.ORGANIZATION_DB_USER || 'postgres',
  process.env.ORGANIZATION_DB_PASSWORD || 'password',
  {
    host: process.env.ORGANIZATION_DB_HOST || 'localhost',
    port: process.env.ORGANIZATION_DB_PORT || 5433,
    dialect: 'postgres',
    logging: false
  }
);

// Dữ liệu mẫu
const sampleOrganizations = [
  {
    name: 'Đại học Bách Khoa Hà Nội',
    description: 'Trường đại học kỹ thuật hàng đầu Việt Nam, chuyên đào tạo các ngành kỹ thuật, công nghệ và khoa học ứng dụng.',
    short_description: 'Trường đại học kỹ thuật hàng đầu Việt Nam',
    logo: 'https://images.unsplash.com/photo-1562774053-701939374585?w=100&h=100&fit=crop',
    website: 'https://hust.edu.vn',
    email: 'info@hust.edu.vn',
    phone: '+84-24-3868-2442',
    address: 'Số 1 Đại Cồ Việt, Hai Bà Trưng',
    city: 'Hà Nội',
    country: 'Việt Nam',
    postal_code: '100000',
    owner_id: 1,
    org_type: 'university',
    status: 'active',
    org_size: 'large',
    industry: 'Giáo dục',
    founded_year: 1956,
    revenue: 500000000000,
    currency: 'VND',
    employees: 2500,
    departments: 15,
    subscription_plan: 'enterprise',
    subscription_status: 'active',
    subscription_expiry: new Date('2024-12-31'),
    tags: JSON.stringify(['Giáo dục', 'Kỹ thuật', 'Công nghệ', 'Hà Nội']),
    contact_person: JSON.stringify({
      name: 'Nguyễn Văn Minh',
      title: 'Giám đốc CNTT',
      email: 'minh.nv@hust.edu.vn',
      phone: '+84-24-3868-2442',
      department: 'Phòng CNTT',
      isPrimary: true
    }),
    social_media: JSON.stringify({
      website: 'https://hust.edu.vn',
      facebook: 'https://facebook.com/hust.edu.vn',
      youtube: 'https://youtube.com/hust'
    }),
    is_active: true,
    is_verified: true,
    is_premium: true,
    verification_status: 'verified',
    notes: 'Tổ chức giáo dục uy tín, có nhiều năm kinh nghiệm trong đào tạo kỹ thuật.'
  },
  {
    name: 'FPT Software',
    description: 'Công ty phần mềm hàng đầu Việt Nam, chuyên cung cấp dịch vụ phát triển phần mềm và giải pháp công nghệ.',
    short_description: 'Công ty phần mềm hàng đầu Việt Nam',
    logo: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=100&h=100&fit=crop',
    website: 'https://fptsoftware.com',
    email: 'contact@fptsoftware.com',
    phone: '+84-24-7300-1886',
    address: 'Tòa nhà FPT, Duy Tân, Cầu Giấy',
    city: 'Hà Nội',
    country: 'Việt Nam',
    postal_code: '100000',
    owner_id: 1,
    org_type: 'enterprise',
    status: 'active',
    org_size: 'enterprise',
    industry: 'Công nghệ thông tin',
    founded_year: 1999,
    revenue: 2000000000000,
    currency: 'VND',
    employees: 15000,
    departments: 25,
    subscription_plan: 'enterprise',
    subscription_status: 'active',
    subscription_expiry: new Date('2024-11-30'),
    tags: JSON.stringify(['Công nghệ', 'Phần mềm', 'FPT', 'Hà Nội']),
    contact_person: JSON.stringify({
      name: 'Trần Thị Lan',
      title: 'Trưởng phòng Đào tạo',
      email: 'lan.tt@fptsoftware.com',
      phone: '+84-24-7300-1886',
      department: 'Phòng Đào tạo',
      isPrimary: true
    }),
    social_media: JSON.stringify({
      website: 'https://fptsoftware.com',
      linkedin: 'https://linkedin.com/company/fpt-software',
      youtube: 'https://youtube.com/fptsoftware'
    }),
    is_active: true,
    is_verified: true,
    is_premium: true,
    verification_status: 'verified',
    notes: 'Công ty công nghệ lớn, có hệ thống đào tạo nội bộ phát triển.'
  },
  {
    name: 'Trung tâm Đào tạo CNTT Aptech',
    description: 'Trung tâm đào tạo công nghệ thông tin chuyên nghiệp, cung cấp các khóa học lập trình và công nghệ.',
    short_description: 'Trung tâm đào tạo CNTT chuyên nghiệp',
    logo: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=100&h=100&fit=crop',
    website: 'https://aptech.vn',
    email: 'info@aptech.vn',
    phone: '+84-24-3773-0666',
    address: 'Số 285 Đội Cấn, Ba Đình',
    city: 'Hà Nội',
    country: 'Việt Nam',
    postal_code: '100000',
    owner_id: 1,
    org_type: 'training_center',
    status: 'active',
    org_size: 'medium',
    industry: 'Giáo dục',
    founded_year: 1999,
    revenue: 50000000000,
    currency: 'VND',
    employees: 150,
    departments: 8,
    subscription_plan: 'professional',
    subscription_status: 'active',
    subscription_expiry: new Date('2024-10-15'),
    tags: JSON.stringify(['Đào tạo', 'CNTT', 'Lập trình', 'Hà Nội']),
    contact_person: JSON.stringify({
      name: 'Lê Văn Hùng',
      title: 'Giám đốc Trung tâm',
      email: 'hung.lv@aptech.vn',
      phone: '+84-24-3773-0666',
      department: 'Ban Giám đốc',
      isPrimary: true
    }),
    social_media: JSON.stringify({
      website: 'https://aptech.vn',
      facebook: 'https://facebook.com/aptechvietnam',
      youtube: 'https://youtube.com/aptechvietnam'
    }),
    is_active: true,
    is_verified: true,
    is_premium: false,
    verification_status: 'verified',
    notes: 'Trung tâm đào tạo có uy tín, chuyên về các khóa học lập trình.'
  }
];

async function seedOrganizations() {
  try {
    console.log('🔄 Đang kết nối database...');
    await sequelize.authenticate();
    console.log('✅ Kết nối database thành công!');

    console.log('🔄 Đang xóa dữ liệu cũ...');
    await sequelize.query('DELETE FROM organizations WHERE owner_id = 1');

    console.log('🔄 Đang thêm dữ liệu mẫu...');
    for (const org of sampleOrganizations) {
      await sequelize.query(`
        INSERT INTO organizations (
          name, description, short_description, logo, website, email, phone,
          address, city, country, postal_code, owner_id, org_type, status,
          org_size, industry, founded_year, revenue, currency, employees,
          departments, subscription_plan, subscription_status, subscription_expiry,
          tags, contact_person, social_media, is_active, is_verified, is_premium,
          verification_status, notes, created_at, updated_at
        ) VALUES (
          :name, :description, :short_description, :logo, :website, :email, :phone,
          :address, :city, :country, :postal_code, :owner_id, :org_type, :status,
          :org_size, :industry, :founded_year, :revenue, :currency, :employees,
          :departments, :subscription_plan, :subscription_status, :subscription_expiry,
          :tags, :contact_person, :social_media, :is_active, :is_verified, :is_premium,
          :verification_status, :notes, NOW(), NOW()
        )
      `, {
        replacements: org
      });
      console.log(`✅ Đã thêm: ${org.name}`);
    }

    console.log('\n✅ Seed dữ liệu hoàn tất!');
    console.log(`📊 Đã thêm ${sampleOrganizations.length} tổ chức mẫu`);

    // Hiển thị dữ liệu đã thêm
    const [results] = await sequelize.query('SELECT id, name, org_type, status FROM organizations WHERE owner_id = 1');
    console.log('\n📋 Danh sách tổ chức:');
    console.table(results);

  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('\n✅ Đã đóng kết nối database');
  }
}

// Chạy seed
seedOrganizations();
