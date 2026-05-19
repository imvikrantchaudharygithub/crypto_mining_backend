import mongoose, { Schema } from 'mongoose';

const NavLinkSchema: Schema = new Schema(
  {
    label: { type: String, required: true },
    href: { type: String, required: true },
    external: { type: Boolean, default: false },
    group: { type: String, enum: ['navbar', 'footer-quick-links'], default: 'navbar' },
    showOnHomeAnchor: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

const NavLink = mongoose.model('NavLink', NavLinkSchema);
export default NavLink;
