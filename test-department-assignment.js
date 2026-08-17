// Simple test script to check department assignment
// Run this in your browser console on the admin issue detail page

async function testDepartmentAssignment(issueId, departmentId) {
  try {
    console.log('Testing department assignment...');
    console.log('Issue ID:', issueId);
    console.log('Department ID:', departmentId);
    
    const response = await fetch(`/api/issues/${issueId}/assign-department`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        department_id: departmentId
      }),
    });
    
    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', data);
    
    if (response.ok) {
      console.log('✅ Department assignment successful!');
      return data;
    } else {
      console.log('❌ Department assignment failed:', data.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Error testing department assignment:', error);
    return null;
  }
}

async function testDepartmentsFetch() {
  try {
    console.log('Testing departments fetch...');
    
    const response = await fetch('/api/departments');
    const data = await response.json();
    
    console.log('Departments response status:', response.status);
    console.log('Departments data:', data);
    
    if (response.ok && data.departments) {
      console.log('✅ Departments fetch successful!');
      console.log('Available departments:', data.departments.map(d => ({ id: d.id, name: d.name })));
      return data.departments;
    } else {
      console.log('❌ Departments fetch failed:', data.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Error fetching departments:', error);
    return null;
  }
}

// Usage:
// 1. First test if departments are available:
// testDepartmentsFetch()
//
// 2. Then test assignment (replace with actual IDs):
// testDepartmentAssignment('your-issue-id', 'department-uuid')

console.log('Department assignment test functions loaded!');
console.log('Run testDepartmentsFetch() to check if departments are available');
console.log('Run testDepartmentAssignment(issueId, departmentId) to test assignment');