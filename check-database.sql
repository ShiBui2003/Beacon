-- Check if departments table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_name = 'departments'
);

-- Check if department_id column exists in issues table
SELECT EXISTS (
   SELECT FROM information_schema.columns 
   WHERE table_name = 'issues' AND column_name = 'department_id'
);

-- Check if we have any departments
SELECT COUNT(*) as department_count FROM departments;

-- List all departments
SELECT id, name, description, email, is_active FROM departments ORDER BY name;

-- Check if we have any issues with departments assigned
SELECT COUNT(*) as issues_with_departments FROM issues WHERE department_id IS NOT NULL;

-- Sample issue with department info
SELECT 
  i.id,
  i.title,
  i.category,
  i.department_id,
  d.name as department_name
FROM issues i
LEFT JOIN departments d ON i.department_id = d.id
LIMIT 5;