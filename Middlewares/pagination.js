const usePagination = async (req, res, next) => {
  const { page, size } = req.query;
  //if no size query is provided default is 20results shown on each page
  const pageHits = size ? parseInt(size) : 100;
  //if no page query is provided default is set to start at page 1
  const pageNumber = page ? parseInt(page) : 1;
  // Calculate the starting index for the current page
  // We subtract 1 from the page number because array numbering start at 0, while the first page number starts at 1
  const startIndex = (pageNumber - 1) * pageHits;
  // calculation to now which index to stop at for the page result
  const endIndex = startIndex + pageHits;

  req.pagination = {
    pageHits,
    pageNumber,
    startIndex,
    endIndex
  };

  next();
}

export default usePagination;