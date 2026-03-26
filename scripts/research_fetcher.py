import arxiv

def fetch_research():
    # Definimos los keywords basados en tu perfil de investigador
    query = (
        'abs:"distributed control" OR '
        'abs:"power system frequency" OR '
        'abs:"multi-agent robotics" OR '
        'abs:"FPGA Kalman" OR '
        'abs:"graph control"'
    )

    search = arxiv.Search(
        query=query,
        max_results=5,
        sort_by=arxiv.SortCriterion.SubmittedDate
    )

    print(f"--- 🔎 Buscando papers recientes para Jorge --- \n")
    
    results = []
    for result in search.results():
        paper_info = {
            "title": result.title,
            "date": result.published.date(),
            "summary": result.summary[:300] + "...",
            "url": result.pdf_url,
            "authors": [author.name for author in result.authors]
        }
        results.append(paper_info)
        
        print(f"📄 {paper_info['title']}")
        print(f"📅 {paper_info['date']} | 👤 {', '.join(paper_info['authors'][:2])}")
        print(f"🔗 {paper_info['url']}\n")
    
    return results

if __name__ == "__main__":
    fetch_research()