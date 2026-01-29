const mongoose = require('mongoose');

class Database {
    static async connect() {
        try {
            const connectionString = process.env.MONGODB_URI || 'mongodb://localhost:27017/codearena';
            
            await mongoose.connect(connectionString, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE) || 10,
                serverSelectionTimeoutMS: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 30000,
                socketTimeoutMS: parseInt(process.env.DB_SOCKET_TIMEOUT) || 30000,
            });

            console.log('✅ Connected to MongoDB successfully');
            console.log(`📍 Database: ${mongoose.connection.name}`);
            console.log(`🔗 Host: ${mongoose.connection.host}:${mongoose.connection.port}`);
            
            // Set up connection event listeners
            mongoose.connection.on('error', (err) => {
                console.error('❌ MongoDB connection error:', err);
            });

            mongoose.connection.on('disconnected', () => {
                console.log('📅 MongoDB disconnected');
            });

            mongoose.connection.on('reconnected', () => {
                console.log('🔄 MongoDB reconnected');
            });

            // Handle graceful shutdown
            process.on('SIGINT', async () => {
                await mongoose.connection.close();
                console.log('📅 MongoDB connection closed through app termination');
                process.exit(0);
            });

        } catch (error) {
            console.error('❌ MongoDB connection failed:', error.message);
            
            if (process.env.NODE_ENV === 'production') {
                process.exit(1);
            } else {
                console.log('🚧 Running in development mode - will retry connection');
                setTimeout(() => this.connect(), 5000); // Retry after 5 seconds
            }
        }
    }

    static async disconnect() {
        try {
            await mongoose.connection.close();
            console.log('📅 Database connection closed');
        } catch (error) {
            console.error('Error closing database connection:', error);
        }
    }

    static isConnected() {
        return mongoose.connection.readyState === 1;
    }

    static getConnectionStatus() {
        const states = ['Disconnected', 'Connected', 'Connecting', 'Disconnecting'];
        return states[mongoose.connection.readyState];
    }
}

module.exports = Database;
