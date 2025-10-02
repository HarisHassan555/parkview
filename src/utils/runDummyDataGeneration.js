import { generateAllDummyData, addMorePakistaniUsers } from './dummyDataGenerator.js';

// Function to run the dummy data generation
const runDummyDataGeneration = async () => {
  try {
    console.log('🚀 Starting dummy data generation process...');
    
    // Step 1: Generate data for Haris Hassan and Ali Mehdi
    console.log('📝 Step 1: Creating users Haris Hassan and Ali Mehdi with historical data...');
    await generateAllDummyData();
    
    // Step 2: Add more Pakistani users
    console.log('📝 Step 2: Adding more Pakistani users with historical data...');
    await addMorePakistaniUsers();
    
    console.log('✅ All dummy data generation completed successfully!');
    console.log('📊 Summary:');
    console.log('- Created users: Haris Hassan, Ali Mehdi, and 8 additional Pakistani users');
    console.log('- Generated 6+ entries per month for the last 6 months for each user');
    console.log('- Services used: EasyPaisa, JazzCash, Meezan Bank, Alfalah Bank');
    console.log('- All entries include realistic Pakistani names, phone numbers, and transaction descriptions');
    
  } catch (error) {
    console.error('❌ Error during dummy data generation:', error);
    throw error;
  }
};

// Export the function for use in other files
export default runDummyDataGeneration;

// If this file is run directly, execute the function
if (import.meta.url === `file://${process.argv[1]}`) {
  runDummyDataGeneration()
    .then(() => {
      console.log('🎉 Dummy data generation completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Dummy data generation failed:', error);
      process.exit(1);
    });
}
