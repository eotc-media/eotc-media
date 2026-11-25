-- One more sermon topic: the Fast of the Prophets (ጾመ ነቢያት), between Season of
-- Flowers and Nativity in the church year. It shares Season of Flowers'
-- position number and sorts after it by id, so no existing row changes.
-- Added: one row. Safe to run twice.

INSERT INTO "sm_topics" ("slug", "group_key", "name_am", "name_en", "position")
VALUES ('fast-of-prophets', 'feasts', 'ጾመ ነቢያት', 'Fast of the Prophets (Advent)', 3)
ON CONFLICT ("slug") DO NOTHING;
