// Shared helpers for schemas
export const tsOpts = { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } };

// Add a clean JSON transformer and optional alias for *_id naming
export function applyToJSON(schema, alias) {
    schema.set('toJSON', {
        virtuals: false,
        versionKey: false,
        transform: (_doc, ret) => {
            if (alias) {
                ret[alias] = ret._id; // e.g., user_id/page_id
                delete ret._id;
            }
            return ret;
        }
    });
}