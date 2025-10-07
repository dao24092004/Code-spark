const serviceCommunication = require('./communication');
const config = require('../config');

class DataSynchronizer {
    constructor() {
        this.syncQueue = [];
        this.isRunning = false;
        this.lastSyncTime = null;
    }

    /**
     * Synchronize copyright data when new registration occurs
     */
    async syncCopyrightRegistration(copyrightData) {
        console.log(`🔄 Starting data synchronization for copyright ${copyrightData.id}`);

        const syncData = {
            copyrightId: copyrightData.id,
            hash: copyrightData.hash,
            filename: copyrightData.filename,
            ownerAddress: copyrightData.ownerAddress,
            transactionHash: copyrightData.transactionHash,
            timestamp: new Date().toISOString(),
            eventType: 'copyright_registered'
        };

        try {
            // Add to sync queue
            this.syncQueue.push(syncData);
            this.lastSyncTime = Date.now();

            // Process immediately if not running
            if (!this.isRunning) {
                await this.processSyncQueue();
            }

            console.log(`✅ Data synchronization completed for copyright ${copyrightData.id}`);
            return { success: true, syncedServices: ['analytics', 'notification'] };

        } catch (error) {
            console.error(`❌ Data synchronization failed for copyright ${copyrightData.id}:`, error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Process synchronization queue
     */
    async processSyncQueue() {
        if (this.isRunning || this.syncQueue.length === 0) {
            return;
        }

        this.isRunning = true;

        while (this.syncQueue.length > 0) {
            const syncItem = this.syncQueue.shift();
            await this.syncToAllServices(syncItem);
        }

        this.isRunning = false;
    }

    /**
     * Sync data to all dependent services
     */
    async syncToAllServices(syncData) {
        const syncPromises = [];

        // Sync with identity service (user profile update)
        if (syncData.ownerAddress) {
            syncPromises.push(this.syncWithIdentityService(syncData));
        }

        // Sync with analytics service
        syncPromises.push(this.syncWithAnalyticsService(syncData));

        // Sync with notification service
        syncPromises.push(this.syncWithNotificationService(syncData));

        // Wait for all sync operations
        const results = await Promise.allSettled(syncPromises);

        // Log results
        results.forEach((result, index) => {
            const serviceName = this.getServiceName(index);
            if (result.status === 'fulfilled') {
                console.log(`✅ ${serviceName} sync successful`);
            } else {
                console.warn(`⚠️ ${serviceName} sync failed:`, result.reason?.message);
            }
        });

        return results;
    }

    /**
     * Sync with Java identity service
     */
    async syncWithIdentityService(syncData) {
        try {
            // Update user's copyright count in Java identity service
            await serviceCommunication.updateUserCopyrightCount(syncData.ownerAddress, 1);

            return { service: 'identity', success: true };
        } catch (error) {
            throw new Error(`Java Identity service sync failed: ${error.message}`);
        }
    }

    /**
     * Sync with Java analytics service
     */
    async syncWithAnalyticsService(syncData) {
        try {
            const analyticsData = {
                eventType: 'COPYRIGHT_REGISTRATION',
                userAddress: syncData.ownerAddress,
                copyrightId: syncData.copyrightId,
                fileHash: syncData.hash,
                filename: syncData.filename,
                timestamp: syncData.timestamp,
                metadata: {
                    transactionHash: syncData.transactionHash,
                    blockchainRegistered: !!syncData.transactionHash,
                    similarityChecked: syncData.similarityChecked,
                    similarDocuments: syncData.similarDocuments?.length || 0
                }
            };

            await serviceCommunication.sendAnalytics('COPYRIGHT_REGISTRATION', analyticsData);
            return { service: 'analytics', success: true };
        } catch (error) {
            throw new Error(`Java Analytics service sync failed: ${error.message}`);
        }
    }

    /**
     * Sync with Java notification service
     */
    async syncWithNotificationService(syncData) {
        try {
            await serviceCommunication.sendNotification(
                syncData.ownerAddress,
                'COPYRIGHT_REGISTRATION_SUCCESS',
                `Your document "${syncData.filename}" has been successfully registered for copyright protection.`,
                {
                    copyrightId: syncData.copyrightId,
                    transactionHash: syncData.transactionHash,
                    registrationTime: syncData.timestamp,
                    blockchainRegistered: !!syncData.transactionHash
                }
            );

            return { service: 'notification', success: true };
        } catch (error) {
            throw new Error(`Java Notification service sync failed: ${error.message}`);
        }
    }

    /**
     * Get service name by index
     */
    getServiceName(index) {
        const services = ['identity', 'analytics', 'notification'];
        return services[index] || `service_${index}`;
    }

    /**
     * Periodic data synchronization
     */
    startPeriodicSync(intervalMinutes = 5) {
        setInterval(async () => {
            console.log('🔄 Running periodic data synchronization...');

            try {
                // Sync any pending data
                await this.processSyncQueue();

                // Health check all services
                const healthStatus = await serviceCommunication.healthCheck();
                console.log('📊 Services health status:', healthStatus);

                // Log sync statistics
                this.logSyncStatistics();

            } catch (error) {
                console.error('❌ Periodic sync failed:', error.message);
            }
        }, intervalMinutes * 60 * 1000);
    }

    /**
     * Log synchronization statistics
     */
    logSyncStatistics() {
        const stats = {
            queueLength: this.syncQueue.length,
            lastSyncTime: this.lastSyncTime,
            isRunning: this.isRunning,
            uptime: process.uptime()
        };

        console.log('📈 Sync Statistics:', stats);
        return stats;
    }

    /**
     * Get sync status
     */
    getSyncStatus() {
        return {
            queueLength: this.syncQueue.length,
            isRunning: this.isRunning,
            lastSyncTime: this.lastSyncTime,
            statistics: this.logSyncStatistics()
        };
    }

    /**
     * Clear sync queue (emergency)
     */
    clearSyncQueue() {
        const clearedCount = this.syncQueue.length;
        this.syncQueue = [];
        console.log(`🧹 Cleared ${clearedCount} items from sync queue`);
        return clearedCount;
    }

    /**
     * Retry failed synchronizations
     */
    async retryFailedSyncs() {
        console.log('🔄 Retrying failed synchronizations...');
        await this.processSyncQueue();
    }
}

module.exports = new DataSynchronizer();
