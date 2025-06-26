@@ .. @@
   async getApprovedMedia(): Promise<MediaAsset[]> {
     const { data, error } = await this.supabase
       .from('media_assets')
-      .select('*')
+      .select('id, title, description, type, category, cloudflare_id, thumbnail_url, duration, resolution, file_size, tags, individual_price, package_price, exclusive_price, is_exclusive, location, property_type, property_name, upload_date, status, downloads, revenue')
       .eq('status', 'approved')
       .eq('is_exclusive', false)
       .order('upload_date', { ascending: false });

@@ .. @@
   async getActivePackages(): Promise<MediaPackage[]> {
     const { data: packages, error } = await this.supabase
       .from('media_packages')
-      .select('*')
+      .select('id, title, description, property_name, property_type, location, media_assets, package_price, individual_total, savings_amount, is_exclusive, exclusive_price, created_at, status')
       .eq('status', 'active')
       .eq('is_exclusive', false)
       .order('created_at', { ascending: false });

     if (error) {
       console.error('Error fetching packages:', error);
       return [];
     }

-    return packages || [];
+    // Fetch media asset details for each package to count types
+    const packagesWithCounts = await Promise.all(
+      (packages || []).map(async (pkg) => {
+        if (!pkg.media_assets || pkg.media_assets.length === 0) {
+          return { ...pkg, imageCount: 0, videoCount: 0 };
+        }
+
+        const { data: assets, error: assetsError } = await this.supabase
+          .from('media_assets')
+          .select('type')
+          .in('id', pkg.media_assets);
+
+        if (assetsError) {
+          console.error('Error fetching package assets:', assetsError);
+          return { ...pkg, imageCount: 0, videoCount: 0 };
+        }
+
+        const imageCount = assets?.filter(asset => asset.type === 'image').length || 0;
+        const videoCount = assets?.filter(asset => asset.type === 'video').length || 0;
+
+        return { ...pkg, imageCount, videoCount };
+      })
+    );
+
+    return packagesWithCounts;
   }