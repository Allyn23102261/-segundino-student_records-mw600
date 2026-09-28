# Student Records (MySQL + phpMyAdmin)
1. Open XAMPP Control Panel and start MySQL (Apache too, for phpMyAdmin)
2. In this folder run: npm install
3. Then: npm start
4. Open http://localhost:3000
5. View data at http://localhost/phpmyadmin -> database "studentdb" -> table "students"

The database and table are created automatically. schema.sql is there if you prefer to import it manually in phpMyAdmin.
If your MySQL root has a password, edit the CONFIG block at the top of server.js.
