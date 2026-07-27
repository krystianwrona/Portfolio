export const SITE_URL = "https://krystianwrona.com";

// Referenced via {"@id": PERSON_ID} in each case study's JSON-LD `author` field
// so search engines resolve every page's author to the same Person entity
// defined once on the homepage, instead of duplicating the full Person object.
export const PERSON_ID = `${SITE_URL}/#person`;
