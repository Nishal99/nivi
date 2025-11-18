import supplierModel from '../models/supplierModel.mjs';

const supplierController = {
    getAllSuppliers: async (req, res) => {
        try {
            const suppliers = await supplierModel.getAllSuppliers();
            res.json(suppliers);
        } catch (error) {
            console.error('Error in getAllSuppliers:', error);
            res.status(500).json({ message: 'Error fetching suppliers' });
        }
    },

    getSupplierById: async (req, res) => {
        try {
            const supplier = await supplierModel.getSupplierById(req.params.id);
            if (!supplier) {
                return res.status(404).json({ message: 'Supplier not found' });
            }
            res.json(supplier);
        } catch (error) {
            console.error('Error in getSupplierById:', error);
            res.status(500).json({ message: 'Error fetching supplier' });
        }
    },

    createSupplier: async (req, res) => {
        try {
            const supplierId = await supplierModel.createSupplier(req.body);
            res.status(201).json({ 
                message: 'Supplier created successfully', 
                supplierId 
            });
        } catch (error) {
            console.error('Error in createSupplier:', error);
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ message: 'Email already exists' });
            }
            res.status(500).json({ message: 'Error creating supplier' });
        }
    },

    updateSupplier: async (req, res) => {
        try {
            const success = await supplierModel.updateSupplier(req.params.id, req.body);
            if (!success) {
                return res.status(404).json({ message: 'Supplier not found' });
            }
            res.json({ message: 'Supplier updated successfully' });
        } catch (error) {
            console.error('Error in updateSupplier:', error);
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ message: 'Email already exists' });
            }
            res.status(500).json({ message: 'Error updating supplier' });
        }
    },

    deleteSupplier: async (req, res) => {
        try {
            const success = await supplierModel.deleteSupplier(req.params.id);
            if (!success) {
                return res.status(404).json({ message: 'Supplier not found' });
            }
            res.json({ message: 'Supplier deleted successfully' });
        } catch (error) {
            console.error('Error in deleteSupplier:', error);
            res.status(500).json({ message: 'Error deleting supplier' });
        }
    },

    searchSuppliers: async (req, res) => {
        try {
            const { query } = req.query;
            if (!query) {
                return res.status(400).json({ message: 'Search query is required' });
            }
            const suppliers = await supplierModel.searchSuppliers(query);
            res.json(suppliers);
        } catch (error) {
            console.error('Error in searchSuppliers:', error);
            res.status(500).json({ message: 'Error searching suppliers' });
        }
    }
};

export default supplierController;