For every specimen, a pathologist writes a report: long, structured, and largely the same each time for the same organ, with the findings changing inside it. Patho Draft was my master's final-year project, built with the pathology department of CHU Mohammed VI in Tangier, to draft those reports so the pathologist only has to read, correct and sign.

### Templates as a small language

Each organ has several report templates, so the heart of it is a detailed map from keywords to templates, and a way to write templates that the system can understand. I designed a small template language for it. A template declares its inputs, typed (text, a number, one choice or several), gathers its text into sections, and can include a passage only when a condition holds. It can also pass a value through converters, a measurement turned into another unit, for instance. Expressions are evaluated safely rather than run as code.

The same template becomes the form the pathologist fills in, and that form, filled in, produces the report. A pathologist can edit a template on the fly, and the language was meant to sit underneath a drag-and-drop editor, so the templates could be changed without writing them by hand.

### Where AI helps

AI does two things. From a few keywords, it identifies which template applies, so the pathologist does not hunt through a list. And it takes dictation, turning speech into text in the report's fields, since a pathologist at the microscope rarely has a free hand. The pathologist reviews everything before it is final.

### Built for the hospital

Report writing cannot stop when the network does, so it keeps working offline, and access is limited to the hospital's staff. It is a Next.js application on Supabase, with a Lexical editor for the reports.
