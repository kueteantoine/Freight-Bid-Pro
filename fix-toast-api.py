#!/usr/bin/env python3
"""
Script to fix toast API calls in settings manager components.
Converts from shadcn/ui toast API to sonner API.
"""

import re
import os

# Files to fix
files = [
    "src/components/admin/settings/VehicleTypesManager.tsx",
    "src/components/admin/settings/FreightCategoriesManager.tsx",
    "src/components/admin/settings/ServiceRegionsManager.tsx",
    "src/components/admin/settings/CommissionTiersManager.tsx",
    "src/components/admin/settings/SurgePricingManager.tsx",
    "src/components/admin/settings/PromotionalCodesManager.tsx",
    "src/components/admin/settings/TaxRatesManager.tsx",
]

def fix_toast_calls(content):
    """Fix toast API calls to use sonner format."""
    
    # Pattern 1: toast({ title: 'Success', description: '...' })
    # Replace with: toast.success('...')
    pattern1 = r"toast\(\{\s*title:\s*['\"]Success['\"]\s*,\s*description:\s*(['\"].*?['\"])\s*,?\s*\}\)"
    content = re.sub(pattern1, r"toast.success(\1)", content, flags=re.DOTALL)
    
    # Pattern 2: toast({ title: 'Error', description: '...', variant: 'destructive' })
    # Replace with: toast.error('...')
    pattern2 = r"toast\(\{\s*title:\s*['\"]Error['\"]\s*,\s*description:\s*(['\"].*?['\"]|.*?)\s*,?\s*variant:\s*['\"]destructive['\"]\s*,?\s*\}\)"
    content = re.sub(pattern2, r"toast.error(\1)", content, flags=re.DOTALL)
    
    # Pattern 3: toast({ title: 'Error', description: result.error || '...' })
    # Replace with: toast.error(result.error || '...')
    pattern3 = r"toast\(\{\s*title:\s*['\"]Error['\"]\s*,\s*description:\s*(result\.error\s*\|\|\s*['\"].*?['\"])\s*,?\s*variant:\s*['\"]destructive['\"]\s*,?\s*\}\)"
    content = re.sub(pattern3, r"toast.error(\1)", content, flags=re.DOTALL)
    
    # Pattern 4: Handle remaining error toasts without variant
    pattern4 = r"toast\(\{\s*title:\s*['\"]Error['\"]\s*,\s*description:\s*(.*?)\s*,?\s*\}\)"
    content = re.sub(pattern4, r"toast.error(\1)", content, flags=re.DOTALL)
    
    return content

def main():
    base_path = "c:/Users/Kuete Antoine/dyad-apps/Freight Bid Pro"
    
    for file_path in files:
        full_path = os.path.join(base_path, file_path)
        
        if not os.path.exists(full_path):
            print(f"❌ File not found: {full_path}")
            continue
        
        print(f"📝 Processing: {file_path}")
        
        with open(full_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        content = fix_toast_calls(content)
        
        if content != original_content:
            with open(full_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✅ Fixed toast calls in: {file_path}")
        else:
            print(f"ℹ️  No changes needed: {file_path}")

if __name__ == "__main__":
    main()
    print("\n✨ Toast API fixes complete!")
