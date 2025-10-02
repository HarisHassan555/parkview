import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase/services.js';

// Pakistani names for dummy users
const PAKISTANI_NAMES = [
  'Haris Hassan',
  'Ali Mehdi', 
  'Ahmad Raza',
  'Muhammad Usman',
  'Hassan Ali',
  'Bilal Ahmed',
  'Saad Khan',
  'Zain Malik',
  'Omar Sheikh',
  'Taha Iqbal',
  'Fahad Ali',
  'Waseem Akram',
  'Shahid Afridi',
  'Imran Khan',
  'Naseem Shah',
  'Babar Azam',
  'Shaheen Afridi',
  'Fakhar Zaman',
  'Mohammad Rizwan',
  'Shoaib Malik'
];

// Pakistani mobile payment services
const SERVICES = [
  'EasyPaisa',
  'JazzCash', 
  'Meezan Bank',
  'Alfalah Bank'
];

// Common Pakistani transaction descriptions
const TRANSACTION_DESCRIPTIONS = [
  'Mobile Top-up',
  'Electricity Bill Payment',
  'Gas Bill Payment',
  'Water Bill Payment',
  'Internet Bill Payment',
  'Grocery Shopping',
  'Restaurant Payment',
  'Fuel Payment',
  'Medical Expenses',
  'School Fee Payment',
  'Transport Fare',
  'Online Shopping',
  'Utility Bill Payment',
  'Cash Withdrawal',
  'Money Transfer',
  'Donation',
  'Charity Payment',
  'Wedding Gift',
  'Eid Gift',
  'Family Support'
];

// Pakistani phone number prefixes
const PHONE_PREFIXES = ['0300', '0301', '0302', '0303', '0304', '0305', '0306', '0307', '0308', '0309', '0310', '0311', '0312', '0313', '0314', '0315', '0316', '0317', '0318', '0319', '0320', '0321', '0322', '0323', '0324', '0325', '0330', '0331', '0332', '0333', '0334', '0335', '0336', '0337', '0340', '0341', '0342', '0343', '0344', '0345', '0346', '0347', '0348', '0349', '0350', '0351', '0352', '0353', '0354', '0355', '0356', '0357', '0358', '0359', '0360', '0361', '0362', '0363', '0364', '0365', '0366', '0367', '0368', '0369', '0370', '0371', '0372', '0373', '0374', '0375', '0376', '0377', '0378', '0379', '0380', '0381', '0382', '0383', '0384', '0385', '0386', '0387', '0388', '0389', '0390', '0391', '0392', '0393', '0394', '0395', '0396', '0397', '0398', '0399'];

// Generate random Pakistani phone number
const generatePhoneNumber = () => {
  const prefix = PHONE_PREFIXES[Math.floor(Math.random() * PHONE_PREFIXES.length)];
  const suffix = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
  return prefix + suffix;
};

// Generate random amount between 100 and 50000 PKR
const generateAmount = () => {
  return Math.floor(Math.random() * 49900) + 100;
};

// Generate random date within a specific month
const generateDateInMonth = (year, month) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const day = Math.floor(Math.random() * daysInMonth) + 1;
  const hour = Math.floor(Math.random() * 24);
  const minute = Math.floor(Math.random() * 60);
  const second = Math.floor(Math.random() * 60);
  
  return new Date(year, month, day, hour, minute, second);
};

// Generate random transaction ID
const generateTransactionId = (service) => {
  const prefixes = {
    'EasyPaisa': 'EP',
    'JazzCash': 'JC', 
    'Meezan Bank': 'MZ',
    'Alfalah Bank': 'AF'
  };
  
  const prefix = prefixes[service] || 'TX';
  const randomNum = Math.floor(Math.random() * 1000000000);
  return `${prefix}${randomNum}`;
};

// Generate dummy mobile payment data
const generateMobilePaymentData = (userName, service, date) => {
  const fromName = userName;
  const toName = PAKISTANI_NAMES[Math.floor(Math.random() * PAKISTANI_NAMES.length)];
  const fromPhone = generatePhoneNumber();
  const toPhone = generatePhoneNumber();
  const amount = generateAmount();
  const description = TRANSACTION_DESCRIPTIONS[Math.floor(Math.random() * TRANSACTION_DESCRIPTIONS.length)];
  const transactionId = generateTransactionId(service);
  
  // Format date and time
  const dateStr = date.toLocaleDateString('en-GB', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  });
  const timeStr = date.toLocaleTimeString('en-GB', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  });
  
  return {
    service: service,
    transactionId: transactionId,
    date: dateStr,
    time: timeStr,
    amount: amount,
    fromName: fromName,
    toName: toName,
    fromPhone: fromPhone,
    toPhone: toPhone,
    fromAccount: fromPhone,
    toAccount: toPhone,
    status: 'Success',
    currency: 'PKR',
    description: description,
    rawText: `Mobile Payment Receipt
Service: ${service}
Transaction ID: ${transactionId}
Date: ${dateStr}
Time: ${timeStr}
From: ${fromName} (${fromPhone})
To: ${toName} (${toPhone})
Amount: PKR ${amount}
Description: ${description}
Status: Success`
  };
};

// Create user in Firebase
export const createDummyUser = async (userName) => {
  try {
    console.log(`Creating user: ${userName}`);
    const userRef = doc(db, 'users', userName);
    await setDoc(userRef, {
      name: userName,
      createdAt: serverTimestamp(),
      lastActive: serverTimestamp(),
      documentCount: 0
    });
    console.log(`✅ User created: ${userName}`);
    return userName;
  } catch (error) {
    console.error(`❌ Error creating user ${userName}:`, error);
    throw error;
  }
};

// Generate and save dummy documents for a user
export const generateDummyDocumentsForUser = async (userName, monthsBack = 6) => {
  try {
    console.log(`Generating dummy documents for ${userName} for last ${monthsBack} months`);
    
    const currentDate = new Date();
    const documents = [];
    
    for (let monthOffset = monthsBack; monthOffset >= 0; monthOffset--) {
      const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - monthOffset, 1);
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth();
      
      // Generate 6-10 entries per month (average 6, some months more)
      const entriesThisMonth = Math.floor(Math.random() * 5) + 6; // 6-10 entries
      
      for (let i = 0; i < entriesThisMonth; i++) {
        const service = SERVICES[Math.floor(Math.random() * SERVICES.length)];
        const entryDate = generateDateInMonth(year, month);
        
        const paymentData = generateMobilePaymentData(userName, service, entryDate);
        
        // Create document data
        const documentData = {
          userId: userName,
          fileName: `${service}_Receipt_${paymentData.transactionId}.txt`,
          fileType: 'text/plain',
          fileSize: paymentData.rawText.length,
          extractedData: paymentData,
          rawOcrText: paymentData.rawText,
          documentType: 'mobile_payment',
          uploadedAt: entryDate,
          processedAt: entryDate
        };
        
        documents.push(documentData);
      }
    }
    
    // Save all documents to Firebase
    const documentsRef = collection(db, 'documents');
    const savedDocuments = [];
    
    for (const docData of documents) {
      try {
        const docRef = await addDoc(documentsRef, docData);
        savedDocuments.push(docRef.id);
        console.log(`✅ Document saved: ${docData.fileName}`);
      } catch (error) {
        console.error(`❌ Error saving document ${docData.fileName}:`, error);
      }
    }
    
    // Update user's document count
    const userRef = doc(db, 'users', userName);
    await setDoc(userRef, {
      documentCount: documents.length,
      lastActive: serverTimestamp()
    }, { merge: true });
    
    console.log(`✅ Generated ${documents.length} documents for ${userName}`);
    return savedDocuments;
    
  } catch (error) {
    console.error(`❌ Error generating documents for ${userName}:`, error);
    throw error;
  }
};

// Main function to generate all dummy data
export const generateAllDummyData = async () => {
  try {
    console.log('🚀 Starting dummy data generation...');
    
    // Create users
    const users = ['Haris Hassan', 'Ali Mehdi'];
    for (const userName of users) {
      await createDummyUser(userName);
    }
    
    // Generate documents for each user
    for (const userName of users) {
      await generateDummyDocumentsForUser(userName, 6); // Last 6 months
    }
    
    console.log('✅ All dummy data generated successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Error generating dummy data:', error);
    throw error;
  }
};

// Function to add more Pakistani users with dummy data
export const addMorePakistaniUsers = async () => {
  try {
    console.log('🚀 Adding more Pakistani users with dummy data...');
    
    // Select 8 random Pakistani names (excluding the ones we already have)
    const existingUsers = ['Haris Hassan', 'Ali Mehdi'];
    const availableNames = PAKISTANI_NAMES.filter(name => !existingUsers.includes(name));
    const selectedNames = availableNames.slice(0, 8);
    
    for (const userName of selectedNames) {
      await createDummyUser(userName);
      await generateDummyDocumentsForUser(userName, 6); // Last 6 months
    }
    
    console.log('✅ Added more Pakistani users with dummy data!');
    return true;
    
  } catch (error) {
    console.error('❌ Error adding more users:', error);
    throw error;
  }
};

export default {
  generateAllDummyData,
  addMorePakistaniUsers,
  createDummyUser,
  generateDummyDocumentsForUser
};
