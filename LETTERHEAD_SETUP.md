# PSIT Kanpur - Official Letterhead Setup

## Instructions for Adding Letterhead Images

To use official PSIT Kanpur letterhead in your reports:

### 1. Prepare Letterhead Images

Create two image files:
- **Header Image**: `public/letterhead-header.png`
  - Recommended size: 2100 x 300 pixels (full width, ~25mm height)
  - Should contain: College logo, name, address, contact details
  - Format: PNG with transparent background preferred

- **Footer Image**: `public/letterhead-footer.png`
  - Recommended size: 2100 x 200 pixels (full width, ~20mm height)
  - Should contain: College website, email, accreditation logos
  - Format: PNG with transparent background preferred

### 2. Place Images in Public Folder

```
ClubSphere/
├── public/
│   ├── letterhead-header.png
│   └── letterhead-footer.png
```

### 3. Update Report Generation

The system will automatically use these letterhead images if they exist in the public folder.

### 4. Alternative: Use URLs

You can also provide letterhead URLs directly:
- Upload letterhead images to your college website
- Use the full URL path when generating reports

## Default Behavior

If letterhead images are not provided:
- Header will show "PSIT KANPUR" text
- Footer will show page numbers only
- Reports will still be professionally formatted

## Format Specifications

**PDF Reports:**
- Header: Top 25mm of each page
- Footer: Bottom 20mm of each page
- Content area: Adjusted to avoid letterhead overlap
- Page numbers: Centered in footer area

**Word Reports:**
- Header/Footer sections with images
- Consistent across all pages
- Professional formatting maintained
