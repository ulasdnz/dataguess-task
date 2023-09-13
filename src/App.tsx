import { useState, useEffect } from "react";
import "./App.css";
import { useQuery, gql } from "@apollo/client";
import colorData from "./colors.json";

const GET_COUNTRIES = gql`
  query Query {
    countries {
      code
      continent {
        name
      }
      languages {
        name
      }
      native
      name
      currency
      phone
    }
  }
`;
type Continent = {
  name: string;
};
type Language = {
  name: string;
};
type COUNTRY = {
  code: string;
  continent: Continent;
  languages: Language[];
  native: string;
  name: string;
  currency: string;
  phone: string;
  key: number;
};

type COUNTRIES = {
  countries: COUNTRY[];
};
function App() {
  const [inputValue, setInputValue] = useState("");
  const { loading, error, data } = useQuery<COUNTRIES>(GET_COUNTRIES);
  const [renderedData, setRenderedData] = useState<any>([]);
  const [colorNumber, setColorNumber] = useState(
    Number(localStorage.getItem("colorNumber"))
  );
  const [selectedItemKey, setSelectedItemKey] = useState<number>(
    Math.min(9, renderedData[renderedData.length - 1]?.key)
  );

  useEffect(() => {
    if (data) {
      const fecthedData = [...data.countries];
      const render = fecthedData.map((country, i) => {
        return { ...country, key: i };
      });
      setRenderedData(render);
    }
  }, [data]);

  useEffect(() => {
    setSelectedItemKey(Math.min(9, renderedData[renderedData.length - 1]?.key));
  }, [renderedData]);

  function filterData(input: string, data: COUNTRIES): any {
    if (data === undefined || data.countries.length < 1) return {};
    const commands: string[] = input.split(" ");
    let isGrouped: boolean = false;
    let shouldSearch: boolean = false;
    let searchTerm: string = "";
    let shouldGroup: boolean = false;
    let groupField: string = "";
    let filteredData: COUNTRY[] = [...data.countries];

    commands.forEach((command) => {
      if (command.startsWith("search:")) {
        shouldSearch = true;
        searchTerm = command.substring(7);
      }
      if (command.startsWith("group:")) {
        shouldGroup = true;
        groupField = command.substring(6);
      }
    });

    if (shouldSearch) {
      filteredData = filteredData?.filter((country) => {
        let res =
          country.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          country.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          country.continent?.name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          country.currency?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          country.phone.includes(searchTerm) ||
          country.native
            .toLocaleLowerCase()
            .includes(searchTerm.toLocaleLowerCase());

        country.languages.forEach((language) => {
          if (language.name.toLowerCase().includes(searchTerm)) {
            res = true;
          }
        });
        return res;
      });
    }

    filteredData = filteredData.map((country, i) => {
      return { ...country, key: i };
    });

    if (shouldGroup) {
      isGrouped = true;
      const groupedData: any = {};

      filteredData.forEach((item) => {
        const fieldValue = item[groupField as keyof COUNTRY];

        if (typeof fieldValue === "string") {
          if (!groupedData[fieldValue]) {
            groupedData[fieldValue] = [];
          }
          groupedData[fieldValue].push(item);
        } else if (Array.isArray(fieldValue)) {
          const languageNames = fieldValue.map((language) => language.name);
          languageNames.forEach((languageName) => {
            if (!groupedData[languageName]) {
              groupedData[languageName] = [];
            }
            groupedData[languageName].push(item);
          });
        } else if (
          typeof fieldValue === "object" &&
          !Array.isArray(fieldValue) &&
          fieldValue !== null
        ) {
          const continentName = fieldValue.name;
          if (!groupedData[continentName]) {
            groupedData[continentName] = [];
          }
          groupedData[continentName].push(item);
        }
      });

      filteredData = groupedData;
    }

    const newColorNumber = colorNumber + 1;
    localStorage.setItem("colorNumber", newColorNumber.toString());
    setColorNumber(newColorNumber);

    return { filteredData, isGrouped };
  }

  const handleFilterClick = () => {
    console.log(selectedItemKey);
    if (data) {
      const result = filterData(inputValue.toLocaleLowerCase(), data);

      if (!result.isGrouped) {
        setRenderedData(result.filteredData);
      } else {
        let newData: any = [];
        for (let group in result.filteredData) {
          newData.push({ isGrouped: true, groupName: group });
          const countries: any = result.filteredData[group];
          newData.push(...countries);
        }
        setRenderedData(newData);
      }
    }
  };

  const handleSelect = (itemKey: number): void => {
    if (itemKey === selectedItemKey) {
      setSelectedItemKey(-1);
      return;
    }
    const newColorNumber = colorNumber + 1;
    localStorage.setItem("colorNumber", newColorNumber.toString());
    setColorNumber(newColorNumber);
    setSelectedItemKey(itemKey);
  };

  return (
    <div className="pb-12">
      <header>
        <h1 className="text-4xl my-6 text-blue-900 font-bold  text-center ">
          Countries
        </h1>
        <div className="w-[60%] flex ml-auto mr-auto rounded-3xl h-auto bg-blue-500 mb-8">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-full p-5 px-6 font-semibold rounded-3xl outline-none bg-gray-200"
          ></input>

          <div>
            <button
              onClick={handleFilterClick}
              className="rounded-3xl w-full h-full p-4 text-white text-xl font-bold"
            >
              Filter
            </button>
          </div>
        </div>
      </header>
      {loading && (
        <div className="text-3xl text-red-500 w-full text-center ">
          Loading...
        </div>
      )}
      {error && (
        <div className="text-3xl text-red-500 ">Error! {error.message}</div>
      )}
      {renderedData?.map((country: any, i: any) =>
        country.isGrouped ? (
          <div
            key={(i + 999) * 999}
            className="text-3xl text-center mt-7 mb-1 font-bold"
          >
            {country.groupName}
          </div>
        ) : (
          <div
            key={country.key}
            onClick={() => handleSelect(country.key)}
            style={
              selectedItemKey == country.key
                ? { backgroundColor: colorData[colorNumber]?.hex }
                : {}
            }
            className="w-[90%] px-5  hover:scale-[1.02] rounded-md flex justify-center mr-auto ml-auto py-5 px-1 cursor-pointer hover:bg-gray-200 border-b-2 border-[#f1f5f9]"
          >
            <div className="w-[100%] flex justify-between">
              <div>
                Name: <strong>{country.name}</strong>
              </div>
              <div>
                Code: <strong>{country.code}</strong>
              </div>

              <div>
                Native: <strong>{country.native}</strong>
              </div>
              <div>
                Continent: <strong>{country.continent.name}</strong>
              </div>

              <div>
                Languages:
                <strong>
                  {country.languages.map((lang: any, i: any) => (
                    <span key={i * 9999}> {lang.name}</span>
                  ))}
                </strong>
              </div>

              <div>
                Currency: <strong>{country.currency}</strong>
              </div>
              <div>
                Phone: <strong>{country.phone}</strong>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}

export default App;
