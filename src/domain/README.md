# Domain (core, GAS-agnostic)

Ensure no imports from @gas/*.ts inside @domain/*.ts
The domain can import @lib/*, but not @features/* or @gas/*.
This single rule nukes most circulars.
